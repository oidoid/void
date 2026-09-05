import {In} from '../input/in.ts'
import {
  canvasHOffset,
  canvasWOffset,
  deltaMsOffset,
  devicePixelRatioOffset,
  drawAlwaysOffset,
  drawCountOffset,
  isFullscreenOffset,
  localDayOffset,
  localHourOffset,
  localMillisOffset,
  localMinuteOffset,
  localMonthOffset,
  localSecondOffset,
  localYearOffset,
  nowMsOffset,
  pointerlockedOffset,
  requestFullscreenOffset,
  requestWakelockOffset,
  updateByteLen,
  updateMsOffset,
  utcMsOffset,
  wakelockedOffset
} from '../input/layout.ts'
import {getWebGL2, Renderer} from '../renderer/renderer.ts'
import {beep, SFX} from '../sfx/sfx.ts'
import {downloadScreenshot, initCanvas} from '../utils/canvas-util.ts'
import {initBody, initMetaViewport} from '../utils/dom-util.ts'
import {isFullscreen} from '../utils/fullscreen-util.ts'
import {
  debug,
  setDrawAlwaysParam,
  setFullscreenParam,
  setWakelockParam
} from './debug.ts'
import {Fullscreen} from './fullscreen.ts'
import {
  type LayerBlendMode,
  type LayerCamMode,
  type LayerConfig,
  layerCamModeFixed,
  layerConfigCamModeOffset,
  layerConfigClipHPhyOffset,
  layerConfigClipWPhyOffset,
  layerConfigClipXPhyOffset,
  layerConfigClipYPhyOffset,
  layerConfigFlagsOffset,
  layerConfigScaleOffset,
  layerConfigShaderOffset,
  layerConfigSprCountOffset,
  layerConfigSprsPtrOffset,
  layerConfigStride,
  layerCount,
  layerFlagsBlendModeMask,
  layerFlagsBlendModeShift,
  layerFlagsDepthFlag,
  layerFlagsDepthMask,
  layerFlagsDepthShift,
  type Shader,
  shaderOverlay,
  shaderSprs,
  shaderTiles
} from './layout.ts'
import {PixelRatioObserver} from './pixel-ratio-observer.ts'
import {LoopLoop, type Platform, renderModePixel} from './platform.ts'
import {Wakelock} from './wakelock.ts'
import {WASI} from './wasi.ts'

export class Eng {
  #canvas!: HTMLCanvasElement
  #clearColor: [number, number, number, number] = [0, 0, 0, 1]
  #drawCount: number = 0
  #drawAlways: boolean = false
  #requestWakelock: boolean = false
  #updateMs: number = 0
  #poll!: DataView
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
    const pixel = this.#wasm.RenderMode() === renderModePixel
    canvas = initCanvas(canvas, pixel ? 'Pixel' : 'Float')

    this.#input = new In(canvas)
    this.#poll = new DataView(
      this.#wasm.memory.buffer,
      this.#wasm.PollPointer(),
      updateByteLen
    )
    this.#drawAlways = debug?.draw === 'always'
    this.#requestWakelock = false
    this.#wakelock.onChange = () => this.#requestUpdate()
    this.#wakelock.enabled = this.#requestWakelock

    initMetaViewport(undefined) // to-do: pass description.
    initBody()

    this.#canvas = canvas
    this.#fullscreen = new Fullscreen(canvas.parentElement!, canvas)
    this.#fullscreen.onChange = () => this.#requestUpdate()
    canvas.addEventListener('webglcontextlost', this.#onCtxLost)
    canvas.addEventListener('webglcontextrestored', this.#onCtxRestored)
    this.#renderer = this.#newRenderer()
    this.#pxRatioObserver.onChange = () => this.#requestUpdate()
  }

  register(): void {
    if (this.#registered) return
    this.#input.onEvent = this.#onInput
    this.#input.register('add')
    addEventListener('visibilitychange', this.#onVisibility)
    // wait for the observer's initial callback to size the canvas; drawing
    // before then leaves it 0x0, which the compositor can flash black.
    this.#resizeObserver.observe(this.#canvas.parentElement!, {
      box: 'device-pixel-content-box'
    })
    this.#pxRatioObserver.register('add')
    this.#registered = true
  }

  update(): void {
    try {
      this.#update()
    } catch (err) {
      // to-do: this.register('remove') instead.
      cancelAnimationFrame(this.#rafId)
      throw err
    }
  }

  #update(): void {
    this.#rafId = 0
    clearTimeout(this.#updateTimeoutId)
    this.#updateTimeoutId = 0
    if (!this.#renderer || this.#renderer.isContextLost()) return
    this.#requestUpdate()
    this.#resumeSFX()
    this.#renderer.resize(this.#phyW, this.#phyH)
    const nowMillis = performance.now()
    this.#writeUpdate(this.#renderer, nowMillis)
    const updateStart = performance.now()
    const loop = this.#wasm.Update()
    this.#playBeeps()
    this.#applyFullscreenRequest()
    this.#applyDrawAlwaysParam()
    this.#applyWakelock()
    if (loop !== LoopLoop) {
      cancelAnimationFrame(this.#rafId)
      this.#rafId = 0
      this.#lastTime = 0
      this.#requestDelayedUpdate()
    }
    this.#updateMs = performance.now() - updateStart
    const buffer = this.#wasm.memory.buffer
    const layerConfigPtr = this.#wasm.LayerConfigsPointer()
    const layerConfigView = new DataView(buffer)
    const camX = this.#wasm.CamX()
    const camY = this.#wasm.CamY()
    this.#renderer.clear(...this.#clearColor)
    this.#drawCount++
    for (let layer = 0; layer < layerCount; layer++) {
      const config = this.#layerConfig(layerConfigView, layerConfigPtr, layer)
      const lx = config.camMode === layerCamModeFixed ? 0 : camX
      const ly = config.camMode === layerCamModeFixed ? 0 : camY
      if (config.shader === shaderTiles) {
        this.#renderer.clearDepth()
        this.#renderer.drawTiles(
          lx,
          ly,
          config.scale,
          config.blendMode,
          config.depth,
          config.clipPhy
        )
      } else if (config.shader === shaderSprs && config.sprCount !== 0) {
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
      } else if (config.shader === shaderOverlay) {
        this.#renderer.clearDepth()
        this.#renderer.drawOverlay(config.blendMode)
      }
    }
    this.#applyPostDrawRequests(this.#renderer)
  }

  #layerConfig(view: DataView, ptr: number, layer: number): LayerConfig {
    const o = ptr + layer * layerConfigStride
    const flags = view.getUint8(o + layerConfigFlagsOffset)
    return {
      clipPhy: {
        x: view.getUint16(o + layerConfigClipXPhyOffset, true),
        y: view.getUint16(o + layerConfigClipYPhyOffset, true),
        w: view.getUint16(o + layerConfigClipWPhyOffset, true),
        h: view.getUint16(o + layerConfigClipHPhyOffset, true)
      },
      camMode: view.getUint8(o + layerConfigCamModeOffset) as LayerCamMode,
      scale: view.getFloat32(o + layerConfigScaleOffset, true),
      shader: view.getUint8(o + layerConfigShaderOffset) as Shader,
      depth:
        ((flags >>> layerFlagsDepthShift) & layerFlagsDepthMask) ===
        layerFlagsDepthFlag,
      blendMode: ((flags >>> layerFlagsBlendModeShift) &
        layerFlagsBlendModeMask) as LayerBlendMode,
      sprsPtr: view.getUint32(o + layerConfigSprsPtrOffset, true),
      sprCount: view.getUint32(o + layerConfigSprCountOffset, true)
    }
  }

  #playBeeps(): void {
    const count = this.#wasm.BeepCount()
    if (count === 0) return
    const view = new DataView(
      this.#wasm.memory.buffer,
      this.#wasm.BeepPointer(),
      count * 16
    )
    for (let i = 0; i < count; i++) {
      const o = i * 16
      beep(
        this.#sfx,
        view.getFloat32(o, true),
        view.getFloat32(o + 4, true),
        view.getFloat32(o + 8, true),
        view.getFloat32(o + 12, true)
      )
    }
  }

  #resumeSFX(): void {
    if (this.#sfx.ctx.state !== 'suspended') return
    if (!navigator.userActivation?.isActive) return
    void this.#sfx.ctx.resume().catch(() => {})
  }

  #requestUpdate(): void {
    if (!this.#renderer || this.#renderer.isContextLost() || this.#rafId) return
    this.#rafId = requestAnimationFrame(() => this.update())
    this.#lastTime ||= performance.now()
  }

  #requestDelayedUpdate(): void {
    const millis = Number(this.#wasm.UpdateInMillisRequest())
    if (millis === 0) return
    this.#updateTimeoutId = setTimeout(() => {
      this.#updateTimeoutId = 0
      this.#requestUpdate()
    }, millis)
  }

  #onResize(entries: readonly Readonly<ResizeObserverEntry>[]): void {
    for (const entry of entries) {
      const [size] = entry.devicePixelContentBoxSize
      if (!size) continue
      this.#phyW = size.inlineSize
      this.#phyH = size.blockSize
    }
    this.#requestUpdate()
  }

  #onCtxLost = (ev: Event): void => {
    ev.preventDefault()
    cancelAnimationFrame(this.#rafId)
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
    if (this.#registered) this.#requestUpdate()
  }

  #newRenderer(): Renderer {
    const atlasCelsPtr = this.#wasm.AtlasCelsPointer()
    const atlasCelsCount = this.#wasm.AtlasCelsCount()
    const atlasCels = new Uint16Array(
      this.#wasm.memory.buffer,
      atlasCelsPtr,
      atlasCelsCount
    )
    const atlasImg = document.getElementById('atlas') as HTMLImageElement
    const pixel = this.#wasm.RenderMode() === renderModePixel
    return new Renderer(
      getWebGL2(this.#canvas, !pixel),
      this.#wasm.memory.buffer,
      this.#wasm.BoardTilesPointer(),
      this.#wasm.BoardW(),
      this.#wasm.BoardH(),
      this.#wasm.BoardTileW(),
      this.#wasm.BoardTileH(),
      atlasCels,
      this.#wasm.AtlasAnimCount(),
      this.#wasm.AtlasCelsPerAnim(),
      atlasImg,
      pixel
    )
  }

  #onVisibility = (): void => {
    this.#input.reset()
    this.#wakelock.enabled = this.#requestWakelock
    this.#requestUpdate()
  }

  #onInput = (): void => {
    this.#fullscreen.onInput()
    this.#requestUpdate()
  }

  #applyFullscreenRequest(): void {
    const request = this.#wasm.FullscreenRequest()
    if (request === 1) {
      if (debug?.window) setFullscreenParam(true)
      this.#fullscreen.enabled = true
    } else if (request === 2) {
      if (!debug?.window) setFullscreenParam(false)
      this.#fullscreen.enabled = false
    }
  }

  #applyPostDrawRequests(renderer: Renderer): void {
    if (this.#wasm.ScreenshotRequest())
      void downloadScreenshot(this.#canvas, 'void')
    if (this.#wasm.ContextLossRequest()) renderer.loseContext()
  }

  #applyDrawAlwaysParam(): void {
    const drawAlways = this.#wasm.DrawAlways() !== 0
    if (drawAlways === this.#drawAlways) return
    this.#drawAlways = drawAlways
    setDrawAlwaysParam(drawAlways)
  }

  #applyWakelock(): void {
    const requestWakelock = this.#wasm.RequestWakelock() !== 0
    if (requestWakelock === this.#requestWakelock) return
    this.#requestWakelock = requestWakelock
    setWakelockParam(requestWakelock)
    this.#wakelock.enabled = requestWakelock
  }

  #writeUpdate(renderer: Renderer, nowMillis: number): void {
    if (this.#poll.buffer !== this.#wasm.memory.buffer)
      this.#poll = new DataView(
        this.#wasm.memory.buffer,
        this.#wasm.PollPointer(),
        updateByteLen
      )
    const delta = this.#lastTime === 0 ? 0 : nowMillis - this.#lastTime
    this.#poll.setFloat64(deltaMsOffset, delta, true)
    this.#poll.setUint16(canvasWOffset, renderer.phyW, true)
    this.#poll.setUint16(canvasHOffset, renderer.phyH, true)
    this.#poll.setUint8(isFullscreenOffset, isFullscreen() ? 1 : 0)
    this.#poll.setUint8(drawAlwaysOffset, this.#drawAlways ? 1 : 0)
    this.#poll.setInt8(requestWakelockOffset, debug?.zzz ? -1 : 0)
    this.#poll.setUint8(wakelockedOffset, this.#wakelock.locked ? 1 : 0)
    this.#poll.setInt32(drawCountOffset, this.#drawCount, true)
    this.#poll.setUint8(requestFullscreenOffset, debug?.window ? 2 : 0)
    this.#poll.setUint8(
      pointerlockedOffset,
      document.pointerLockElement === this.#canvas ? 1 : 0
    )
    this.#poll.setFloat64(updateMsOffset, this.#updateMs, true)
    this.#poll.setFloat64(devicePixelRatioOffset, devicePixelRatio, true)
    const time = Date.now()
    const date = new Date(time)
    this.#poll.setFloat64(nowMsOffset, nowMillis, true)
    this.#poll.setBigUint64(utcMsOffset, BigInt(time), true)
    this.#poll.setUint16(localYearOffset, date.getFullYear(), true)
    this.#poll.setUint8(localMonthOffset, date.getMonth() + 1)
    this.#poll.setUint8(localDayOffset, date.getDate())
    this.#poll.setUint8(localHourOffset, date.getHours())
    this.#poll.setUint8(localMinuteOffset, date.getMinutes())
    this.#poll.setUint8(localSecondOffset, date.getSeconds())
    this.#poll.setUint16(localMillisOffset, date.getMilliseconds(), true)
    this.#input.update(this.#poll)
    this.#input.postupdate() // to-do: move to postupdate()?
    this.#lastTime = nowMillis
  }
}
