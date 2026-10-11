import type {BoardConfig} from '../boards/board-config.ts'
import type {
  LayerBlendMode,
  LayerCamMode,
  LayerConfig,
  Shader
} from '../gfx/layer-config.ts'
import {getWebGL2, Renderer} from '../gfx/renderer.ts'
import {In} from '../in/in.ts'
import {beep, SFX} from '../sfx/sfx.ts'
import {downloadScreenshot, initCanvas} from '../utils/canvas-util.ts'
import {initBody, initMetaViewport} from '../utils/dom-util.ts'
import {isFullscreen} from '../utils/fullscreen-util.ts'
import * as bridge from './bridge.ts'
import {debug} from './debug.ts'
import type {AnyEvent} from './event.ts'
import {Fullscreen} from './fullscreen.ts'
import {PixelRatioObserver} from './pixel-ratio-observer.ts'
import type {Platform} from './platform.ts'
import {Wakelock} from './wakelock.ts'
import {WASI} from './wasi.ts'

export class Eng {
  #canvas!: HTMLCanvasElement
  #clearColor: [number, number, number, number] = [0, 0, 0, 1]
  #drawCount: number = 0
  // waits through pointer/key release so the activating press reaches Go UI.
  #deferFullscreenReq: boolean = false
  #drawAlways: boolean = false
  // carries browser-driven exits to Go independently of debug URL state.
  #fullscreenReq: number = bridge.FullscreenReqNone
  #updateMs: number = 0
  #poll!: DataView
  #out!: DataView
  #pollPtr!: number
  #outPtr!: number
  #input!: In
  #lastTime: number = 0
  #phyW: number = 0 // don't care if these init later.
  #phyH: number = 0
  #rafId: number = 0
  #sfx: SFX = SFX()
  #updateTimeoutId: number = 0
  #registered: boolean = false
  #renderer: Renderer | undefined
  readonly #pxRatioObserver: PixelRatioObserver = new PixelRatioObserver()
  readonly #resizeObserver: ResizeObserver = new ResizeObserver(
    this.#onResize.bind(this)
  )
  #wasm!: Platform
  #fullscreen!: Fullscreen
  readonly #wakelock: Wakelock = new Wakelock()

  // to-do: use Wasm import.
  async load(
    canvas: HTMLCanvasElement | undefined | null,
    wasmURL: string,
    clearColor?: number
  ): Promise<void> {
    if (clearColor != null) {
      this.#clearColor = [
        ((clearColor >>> 24) & 0xff) / 255,
        ((clearColor >>> 16) & 0xff) / 255,
        ((clearColor >>> 8) & 0xff) / 255,
        (clearColor & 0xff) / 255
      ]
    }
    const wasi = new WASI()
    const result = await WebAssembly.instantiateStreaming(fetch(wasmURL), {
      wasi_snapshot_preview1: wasi
    })
    this.#wasm = result.instance.exports as Platform
    wasi.link(this.#wasm.memory)
    this.#wasm._start()
    this.#pollPtr = this.#wasm.PollPtr()
    this.#outPtr = this.#wasm.OutPtr()
    this.#refreshMemory()
    const pixel =
      this.#out.getUint8(bridge.outRenderModeOffset) === bridge.RenderModePixel
    canvas = initCanvas(canvas, pixel ? 'Pixel' : 'Float')

    this.#input = new In(canvas)
    this.#drawAlways = debug?.draw === 'always'
    initMetaViewport(undefined) // to-do: pass description.
    initBody()

    this.#canvas = canvas
    this.#fullscreen = new Fullscreen(canvas.parentElement!, canvas)
    this.#renderer = this.#newRenderer()
  }

  register(): void {
    if (this.#registered) return
    this.#input.onEvent = this.#onInput
    this.#pxRatioObserver.onChange = () => this.#reqUpdate('Force')
    this.#input.register('add')
    this.#canvas.addEventListener('webglcontextlost', this.#onCtxLost)
    this.#canvas.addEventListener('webglcontextrestored', this.#onCtxRestored)
    document.addEventListener('fullscreenchange', this.#onFullscreenChange)
    addEventListener('visibilitychange', this.#onVisibility)
    addEventListener('blur', this.#onFocus)
    addEventListener('focus', this.#onFocus)
    // wait for the observer's initial callback to size the canvas; drawing
    // before then leaves it 0x0, which the compositor can flash black.
    this.#resizeObserver.observe(this.#canvas.parentElement!, {
      box: 'device-pixel-content-box'
    })
    this.#pxRatioObserver.register('add')
    this.#wakelock.update()
    this.#registered = true
  }

  update(force?: 'Force'): void {
    try {
      this.#update(force)
    } catch (err) {
      // to-do: this.register('remove') instead.
      this.#cancelFrame()
      throw err
    }
  }

  #update(force?: 'Force'): void {
    this.#cancelFrame()
    clearTimeout(this.#updateTimeoutId)
    this.#updateTimeoutId = 0
    if (
      !this.#renderer ||
      this.#renderer.isContextLost() ||
      (!force && this.#paused())
    )
      return
    this.#reqUpdate()
    this.#resumeSFX()
    this.#renderer.resize(this.#phyW, this.#phyH)
    const frameMillis = performance.now()
    if (this.#paused()) this.#lastTime = 0
    const nowMillis = this.#writeUpdate(this.#renderer, frameMillis)
    const updateStart = performance.now()
    const loop = this.#wasm.Update()
    this.#refreshMemory()
    const requests = this.#out.getUint8(bridge.outRequestsOffset)
    const updateInMillis = Number(
      this.#out.getBigUint64(bridge.outUpdateInMillisOffset, true)
    )
    this.#playBeeps()
    if (!this.#deferFullscreenReq) this.#applyFullscreenReq()
    this.#applyDrawAlways()
    if (loop !== bridge.LoopLoop || this.#paused()) {
      this.#cancelFrame()
      this.#lastTime = 0
      if (!this.#paused()) this.#reqDelayedUpdate(updateInMillis)
    }
    this.#updateMs = performance.now() - updateStart
    const buffer = this.#wasm.memory.buffer
    const boardLevel = this.#out.getUint16(bridge.outBoardLevelOffset, true)
    if (boardLevel !== this.#renderer.boardLvl)
      this.#renderer.updateBoard(this.#boardRenderState(boardLevel))
    const camX = this.#out.getFloat32(bridge.outCamXOffset, true)
    const camY = this.#out.getFloat32(bridge.outCamYOffset, true)
    this.#renderer.clear(...this.#clearColor)
    this.#drawCount++
    for (let layer = 0; layer < bridge.layerCount; layer++) {
      const config = this.#layerConfig(layer)
      const lx = config.camMode === bridge.layerCamModeFixed ? 0 : camX
      const ly = config.camMode === bridge.layerCamModeFixed ? 0 : camY
      if (config.shader === bridge.shaderTiles) {
        this.#renderer.clearDepth()
        this.#renderer.drawTiles(
          lx,
          ly,
          config.scale,
          config.blendMode,
          config.depth,
          config.clipPhy
        )
      } else if (config.shader === bridge.shaderSprs && config.sprCount !== 0) {
        this.#renderer.clearDepth()
        this.#renderer.drawLayer(
          buffer,
          config.sprsPtr,
          config.sprCount,
          nowMillis,
          lx,
          ly,
          config.scale,
          config.blendMode,
          config.depth,
          config.clipPhy
        )
      } else if (config.shader === bridge.shaderOverlay) {
        this.#renderer.clearDepth()
        this.#renderer.drawOverlay(config.blendMode)
      }
    }
    this.#applyPostDrawReqs(this.#renderer, requests)
  }

  #layerConfig(layer: number): LayerConfig {
    const view = this.#out
    const o = bridge.outLayersOffset + layer * bridge.layerConfigStride
    const flags = view.getUint8(o + bridge.layerConfigFlagsOffset)
    return {
      clipPhy: {
        x: view.getUint16(o + bridge.layerConfigClipXPhyOffset, true),
        y: view.getUint16(o + bridge.layerConfigClipYPhyOffset, true),
        w: view.getUint16(o + bridge.layerConfigClipWPhyOffset, true),
        h: view.getUint16(o + bridge.layerConfigClipHPhyOffset, true)
      },
      camMode: view.getUint8(
        o + bridge.layerConfigCamModeOffset
      ) as LayerCamMode,
      scale: view.getFloat32(o + bridge.layerConfigScaleOffset, true),
      shader: view.getUint8(o + bridge.layerConfigShaderOffset) as Shader,
      depth:
        ((flags >>> bridge.layerFlagsDepthShift) &
          bridge.layerFlagsDepthMask) ===
        bridge.layerFlagsDepthFlag,
      blendMode: ((flags >>> bridge.layerFlagsBlendModeShift) &
        bridge.layerFlagsBlendModeMask) as LayerBlendMode,
      sprsPtr: view.getUint32(o + bridge.layerConfigSprsPtrOffset, true),
      sprCount: view.getUint32(o + bridge.layerConfigSprCountOffset, true)
    }
  }

  #playBeeps(): void {
    const view = this.#out
    const count = view.getUint32(bridge.outBeepCountOffset, true)
    for (let i = 0; i < count; i++) {
      const o = bridge.outBeepsOffset + i * bridge.beepStride
      beep(
        this.#sfx,
        view.getFloat32(o + bridge.beepStartHzOffset, true),
        view.getFloat32(o + bridge.beepEndHzOffset, true),
        view.getFloat32(o + bridge.beepDurationMsOffset, true),
        view.getFloat32(o + bridge.beepDelayMsOffset, true)
      )
    }
  }

  #resumeSFX(): void {
    if (this.#sfx.ctx.state !== 'suspended') return
    if (!navigator.userActivation?.isActive) return
    void this.#sfx.ctx.resume().catch(() => {})
  }

  #reqUpdate(force?: 'Force'): void {
    if (
      !this.#renderer ||
      this.#renderer.isContextLost() ||
      this.#rafId ||
      (!force && this.#paused())
    )
      return
    this.#rafId = requestAnimationFrame(() => this.update(force))
    this.#lastTime ||= performance.now()
  }

  #paused(): boolean {
    this.#refreshMemory()
    return (
      this.#out.getUint8(bridge.outDrawOnBlurOffset) === 0 &&
      (document.hidden || !document.hasFocus())
    )
  }

  #cancelFrame(): void {
    cancelAnimationFrame(this.#rafId)
    this.#rafId = 0
  }

  #reqDelayedUpdate(millis: number): void {
    if (millis === 0) return
    this.#updateTimeoutId = setTimeout(() => {
      this.#updateTimeoutId = 0
      this.#reqUpdate()
    }, millis)
  }

  #onResize(entries: readonly Readonly<ResizeObserverEntry>[]): void {
    for (const entry of entries) {
      const [size] = entry.devicePixelContentBoxSize
      if (!size) continue
      this.#phyW = size.inlineSize
      this.#phyH = size.blockSize
    }
    // resizing needs one frame even when focus loss pauses the loop.
    this.#reqUpdate('Force')
  }

  #onCtxLost = (ev: Event): void => {
    ev.preventDefault()
    this.#cancelFrame()
    clearTimeout(this.#updateTimeoutId)
    this.#renderer?.dispose()
    this.#renderer = undefined
    this.#rafId = 0
    this.#updateTimeoutId = 0
    this.#lastTime = 0
    this.#updateMs = 0
  }

  #onCtxRestored = (): void => {
    this.#renderer = this.#newRenderer()
    if (this.#registered) this.#reqUpdate('Force')
  }

  #newRenderer(): Renderer {
    this.#refreshMemory()
    const out = this.#out
    const atlasCelsPtr = out.getUint32(bridge.outAtlasCelsPtrOffset, true)
    const atlasCelsCount = out.getUint32(bridge.outAtlasCelsCountOffset, true)
    const atlasCels = new Uint16Array(
      this.#wasm.memory.buffer,
      atlasCelsPtr,
      atlasCelsCount
    )
    const atlasImg = document.getElementById('atlas') as HTMLImageElement
    const pixel =
      out.getUint8(bridge.outRenderModeOffset) === bridge.RenderModePixel
    return new Renderer(
      getWebGL2(this.#canvas, !pixel),
      this.#boardRenderState(out.getUint16(bridge.outBoardLevelOffset, true)),
      atlasCels,
      out.getUint32(bridge.outAtlasAnimCountOffset, true),
      out.getUint32(bridge.outAtlasCelsPerAnimOffset, true),
      atlasImg,
      pixel
    )
  }

  #boardRenderState(level: number): BoardConfig {
    const out = this.#out
    return {
      lvl: level,
      tiles: new Uint16Array(
        this.#wasm.memory.buffer,
        out.getUint32(bridge.outBoardTilesPtrOffset, true),
        out.getUint32(bridge.outBoardTilesLenOffset, true)
      ),
      w: out.getInt32(bridge.outBoardWOffset, true),
      h: out.getInt32(bridge.outBoardHOffset, true),
      tileW: out.getUint8(bridge.outBoardTileWOffset),
      tileH: out.getUint8(bridge.outBoardTileHOffset)
    }
  }

  #onVisibility = (): void => {
    this.#wakelock.update()
    this.#onFocus()
  }

  #onFocus = (): void => {
    this.#input.reset()
    this.#cancelFrame()
    clearTimeout(this.#updateTimeoutId)
    this.#updateTimeoutId = 0
    if (this.#paused()) this.#lastTime = 0
    this.#reqUpdate()
  }

  #onFullscreenChange = (): void => {
    this.#fullscreenReq = document.fullscreenElement
      ? bridge.FullscreenReqNone
      : bridge.FullscreenReqExit
    this.#reqUpdate('Force')
  }

  #onInput = (ev: AnyEvent): void => {
    if (ev === 'input-pointerdown' || ev === 'input-keydown') {
      this.#deferFullscreenReq = true
      this.#reqUpdate('Force')
      return
    }
    if (
      ev === 'input-pointerup' ||
      ev === 'input-pointercancel' ||
      ev === 'input-keyup'
    ) {
      this.#deferFullscreenReq = false
      this.#reqUpdate('Force')
      return
    }
    this.#reqUpdate()
  }

  #applyFullscreenReq(): void {
    const req = this.#out.getUint8(bridge.outFullscreenReqOffset)
    if (
      req === bridge.FullscreenReqEnter ||
      req === bridge.FullscreenReqPortrait ||
      req === bridge.FullscreenReqLandscape
    ) {
      void this.#fullscreen.enter(req)
    } else if (req === bridge.FullscreenReqExit) {
      void this.#fullscreen.exit()
    }
  }

  #applyPostDrawReqs(renderer: Renderer, requests: number): void {
    if ((requests >>> bridge.outReqScreenshotShift) & bridge.outReqMask)
      void downloadScreenshot(this.#canvas, 'void', Date.now())
    if ((requests >>> bridge.outReqContextLossShift) & bridge.outReqMask)
      renderer.loseContext()
  }

  #applyDrawAlways(): void {
    const drawAlways = this.#out.getUint8(bridge.outDrawAlwaysOffset) !== 0
    if (drawAlways === this.#drawAlways) return
    this.#drawAlways = drawAlways
  }

  #refreshMemory(): void {
    const buffer = this.#wasm.memory.buffer
    if (this.#poll?.buffer === buffer) return
    this.#poll = new DataView(buffer, this.#pollPtr, bridge.updateByteLen)
    this.#out = new DataView(buffer, this.#outPtr, bridge.outByteLen)
  }

  #writeUpdate(renderer: Renderer, frameMillis: number): number {
    this.#refreshMemory()
    const delta = this.#lastTime === 0 ? 0 : frameMillis - this.#lastTime
    const nowMillis = this.#poll.getFloat64(bridge.nowMsOffset, true) + delta
    this.#poll.setFloat64(bridge.deltaMsOffset, delta, true)
    this.#poll.setUint16(bridge.canvasWOffset, renderer.phyW, true)
    this.#poll.setUint16(bridge.canvasHOffset, renderer.phyH, true)
    this.#poll.setUint8(bridge.isFullscreenOffset, isFullscreen() ? 1 : 0)
    this.#poll.setUint8(bridge.drawAlwaysOffset, this.#drawAlways ? 1 : 0)
    this.#poll.setInt32(bridge.drawCountOffset, this.#drawCount, true)
    const fullscreenReq =
      this.#fullscreenReq !== bridge.FullscreenReqNone
        ? this.#fullscreenReq
        : this.#drawCount === 0 && debug?.window
          ? bridge.FullscreenReqExit
          : bridge.FullscreenReqNone
    this.#fullscreenReq = bridge.FullscreenReqNone
    this.#poll.setUint8(bridge.fullscreenReqOffset, fullscreenReq)
    this.#poll.setUint8(
      bridge.ptrlockedOffset,
      document.pointerLockElement === this.#canvas ? 1 : 0
    )
    this.#poll.setFloat64(bridge.updateMsOffset, this.#updateMs, true)
    this.#poll.setFloat64(bridge.devicePixelRatioOffset, devicePixelRatio, true)
    const time = Date.now()
    const date = new Date(time)
    this.#poll.setFloat64(bridge.nowMsOffset, nowMillis, true)
    this.#poll.setBigUint64(bridge.utcMsOffset, BigInt(time), true)
    this.#poll.setUint16(bridge.localYearOffset, date.getFullYear(), true)
    this.#poll.setUint8(bridge.localMonthOffset, date.getMonth() + 1)
    this.#poll.setUint8(bridge.localDayOffset, date.getDate())
    this.#poll.setUint8(bridge.localHourOffset, date.getHours())
    this.#poll.setUint8(bridge.localMinuteOffset, date.getMinutes())
    this.#poll.setUint8(bridge.localSecondOffset, date.getSeconds())
    this.#poll.setUint16(bridge.localMillisOffset, date.getMilliseconds(), true)
    this.#input.update(this.#poll)
    this.#input.postupdate() // to-do: move to postupdate()?
    this.#lastTime = frameMillis
    return nowMillis
  }
}
