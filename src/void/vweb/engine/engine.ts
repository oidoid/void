import {Input} from '../input/input.ts'
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
  updateByteLen,
  updateMsOffset
} from '../input/layout.ts'
import {Renderer} from '../renderer/renderer.ts'
import {downloadScreenshot, initCanvas} from '../utils/canvas-util.ts'
import {initBody, initMetaViewport} from '../utils/dom-util.ts'
import {
  exitFullscreen,
  isFullscreen,
  requestFullscreen
} from '../utils/fullscreen-util.ts'
import {
  type LayerBlendMode,
  type LayerCamMode,
  type LayerConfig,
  type LayerRenderMode,
  layerCamModeFixed,
  layerConfigCamModeOffset,
  layerConfigClipHPhyOffset,
  layerConfigClipWPhyOffset,
  layerConfigClipXPhyOffset,
  layerConfigClipYPhyOffset,
  layerConfigFlagsOffset,
  layerConfigModuloOffset,
  layerConfigRenderModeOffset,
  layerConfigScaleOffset,
  layerConfigShaderOffset,
  layerConfigSpriteCountOffset,
  layerConfigSpritesPtrOffset,
  layerConfigStride,
  layerCount,
  layerFlagsBlendModeMask,
  layerFlagsBlendModeShift,
  layerFlagsDepthFlag,
  layerFlagsDepthMask,
  layerFlagsDepthShift,
  type Shader,
  shaderOverlay,
  shaderSprites,
  shaderTiles
} from './layout.ts'
import {LoopLoop, type Platform} from './platform.ts'
import {WASI} from './wasi.ts'

export class Engine {
  #canvas!: HTMLCanvasElement
  #clearColor: [number, number, number, number] = [0, 0, 0, 1]
  #drawCount: number = 0
  #drawAlways: boolean = false
  #updateMs: number = 0
  #frame!: DataView
  #input!: Input
  #lastTime: number = 0
  #phyW: number = 0 // don't care if these init later.
  #phyH: number = 0
  #rafId: number = 0
  #updateTimeoutId: number = 0
  #updateTimeoutAtMillis: number = 0
  #registered: boolean = false
  #renderer!: Renderer
  readonly #resizeObserver: ResizeObserver = new ResizeObserver(
    this.#onResize.bind(this)
  )
  #wasm!: Platform

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
    canvas = initCanvas(canvas, 'Float') // to-do: pass render mode.

    this.#input = new Input(canvas)
    const wasi = new WASI()
    const result = await WebAssembly.instantiateStreaming(fetch(wasmURL), {
      wasi_snapshot_preview1: wasi
    })
    this.#wasm = result.instance.exports as Platform
    wasi.link(this.#wasm.memory)
    this.#wasm._start()
    this.#drawAlways = debugDrawOn()
    this.#frame = new DataView(
      this.#wasm.memory.buffer,
      this.#wasm.FramePointer(),
      updateByteLen
    )

    initMetaViewport(undefined) // to-do: pass description.
    initBody()

    this.#canvas = canvas
    canvas.addEventListener('webglcontextlost', this.#onContextLost)
    canvas.addEventListener('webglcontextrestored', this.#onContextRestored)
    this.#renderer = this.#newRenderer()
  }

  register(): void {
    if (this.#registered) return
    this.#input.onEvent = () => this.#requestUpdate()
    this.#input.register('add')
    addEventListener('blur', this.#onReset) // to-do: requestUpdate()?
    addEventListener('visibilitychange', this.#onReset) // to-do: requestUpdate()?
    this.#resizeObserver.observe(this.#canvas.parentElement!, {
      box: 'device-pixel-content-box'
    })
    this.#registered = true
    this.update()
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
    const updateAtMillis = this.#wasm.UpdateAtMillis()
    const nowMillis = performance.timeOrigin + performance.now()
    if (updateAtMillis !== 0 && updateAtMillis <= nowMillis)
      this.#wasm.RequestUpdateAtMillis(0)
    this.#requestUpdate()
    this.#renderer.resize(this.#phyW, this.#phyH)
    this.#writeUpdate()
    const updateStart = performance.now()
    const loop = this.#wasm.Update()
    this.#applyFullscreenRequest()
    this.#applyDrawAlwaysParam()
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
        this.#renderer.drawTiles(
          lx,
          ly,
          config.scale,
          config.modulo,
          config.renderMode,
          config.blendMode,
          config.depth,
          config.clipPhy
        )
      } else if (config.shader === shaderSprites && config.spriteCount !== 0) {
        this.#renderer.drawLayer(
          buffer,
          config.spritesPtr,
          config.spriteCount,
          lx,
          ly,
          config.scale,
          config.modulo,
          config.renderMode,
          config.blendMode,
          config.depth,
          config.clipPhy
        )
      } else if (config.shader === shaderOverlay) {
        this.#renderer.drawOverlay(config.blendMode)
      }
    }
    this.#applyPostDrawRequests()
  }

  #layerConfig(view: DataView, ptr: number, layer: number): LayerConfig {
    const o = ptr + layer * layerConfigStride
    const flags = view.getUint8(o + layerConfigFlagsOffset)
    return {
      renderMode: view.getUint8(
        o + layerConfigRenderModeOffset
      ) as LayerRenderMode,
      clipPhy: {
        x: view.getUint16(o + layerConfigClipXPhyOffset, true),
        y: view.getUint16(o + layerConfigClipYPhyOffset, true),
        w: view.getUint16(o + layerConfigClipWPhyOffset, true),
        h: view.getUint16(o + layerConfigClipHPhyOffset, true)
      },
      camMode: view.getUint8(o + layerConfigCamModeOffset) as LayerCamMode,
      scale: view.getFloat32(o + layerConfigScaleOffset, true),
      modulo: view.getUint8(o + layerConfigModuloOffset),
      shader: view.getUint8(o + layerConfigShaderOffset) as Shader,
      depth:
        ((flags >>> layerFlagsDepthShift) & layerFlagsDepthMask) ===
        layerFlagsDepthFlag,
      blendMode: ((flags >>> layerFlagsBlendModeShift) &
        layerFlagsBlendModeMask) as LayerBlendMode,
      spritesPtr: view.getUint32(o + layerConfigSpritesPtrOffset, true),
      spriteCount: view.getUint32(o + layerConfigSpriteCountOffset, true)
    }
  }

  #requestUpdate(): void {
    if (this.#rafId) return
    this.#rafId = requestAnimationFrame(() => this.update())
    this.#lastTime ||= performance.now()
  }

  #requestDelayedUpdate(): void {
    const atMillis = this.#wasm.UpdateAtMillis()
    if (
      atMillis === 0 ||
      (this.#updateTimeoutId !== 0 && this.#updateTimeoutAtMillis === atMillis)
    )
      return
    clearTimeout(this.#updateTimeoutId)
    this.#updateTimeoutAtMillis = atMillis
    this.#updateTimeoutId = setTimeout(
      () => {
        this.#updateTimeoutId = 0
        this.#updateTimeoutAtMillis = 0
        this.#wasm.RequestUpdateAtMillis(0)
        this.#requestUpdate()
      },
      Math.max(0, atMillis - (performance.timeOrigin + performance.now()))
    )
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

  #onContextLost = (ev: Event): void => {
    ev.preventDefault()
    cancelAnimationFrame(this.#rafId)
    clearTimeout(this.#updateTimeoutId)
    this.#rafId = 0
    this.#updateTimeoutId = 0
    this.#updateTimeoutAtMillis = 0
    this.#wasm.RequestUpdateAtMillis(0)
    this.#lastTime = 0
    this.#updateMs = 0
  }

  #onContextRestored = (): void => {
    this.#renderer.dispose()
    this.#renderer = this.#newRenderer()
    if (this.#registered) this.update()
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
    return new Renderer(
      this.#canvas,
      this.#wasm.memory.buffer,
      this.#wasm.TilePointer(),
      this.#wasm.TileCount(),
      this.#wasm.LevelX(),
      this.#wasm.LevelY(),
      this.#wasm.LevelW(),
      this.#wasm.LevelH(),
      this.#wasm.LevelTileW(),
      this.#wasm.LevelTileH(),
      atlasCels,
      this.#wasm.AtlasAnimCount(),
      this.#wasm.AtlasCelsPerAnim(),
      atlasImg
    )
  }

  #onReset = (): void => {
    this.#input.reset()
  }

  #applyFullscreenRequest(): void {
    const request = this.#wasm.FullscreenRequest()
    if (request === 1) {
      // to-do: enum.
      void requestFullscreen({canvas: this.#canvas}, 'NoLock').then(() =>
        this.#requestUpdate()
      )
    } else if (request === 2) {
      void exitFullscreen().then(() => this.#requestUpdate())
    }
  }

  #applyPostDrawRequests(): void {
    if (this.#wasm.ScreenshotRequest())
      void downloadScreenshot(this.#canvas, 'void')
    if (this.#wasm.ContextLossRequest()) this.#renderer.loseContext()
  }

  #applyDrawAlwaysParam(): void {
    const drawAlways = this.#wasm.DrawAlways() !== 0
    if (drawAlways === this.#drawAlways) return
    this.#drawAlways = drawAlways
    setDrawOnParam(drawAlways)
  }

  #writeUpdate(): void {
    if (this.#frame.buffer !== this.#wasm.memory.buffer)
      this.#frame = new DataView(
        this.#wasm.memory.buffer,
        this.#wasm.FramePointer(),
        updateByteLen
      )
    const now = performance.now()
    const delta = this.#lastTime === 0 ? 0 : now - this.#lastTime
    this.#frame.setFloat64(deltaMsOffset, delta, true)
    this.#frame.setUint16(canvasWOffset, this.#renderer.phyW, true)
    this.#frame.setUint16(canvasHOffset, this.#renderer.phyH, true)
    this.#frame.setUint8(isFullscreenOffset, isFullscreen() ? 1 : 0)
    this.#frame.setUint8(drawAlwaysOffset, this.#drawAlways ? 1 : 0)
    this.#frame.setInt32(drawCountOffset, this.#drawCount, true)
    this.#frame.setFloat64(updateMsOffset, this.#updateMs, true)
    this.#frame.setFloat64(devicePixelRatioOffset, devicePixelRatio, true)
    const nowMillis = performance.timeOrigin + now
    const time = new Date(nowMillis)
    this.#frame.setFloat64(nowMsOffset, nowMillis, true)
    this.#frame.setUint16(localYearOffset, time.getFullYear(), true)
    this.#frame.setUint8(localMonthOffset, time.getMonth() + 1)
    this.#frame.setUint8(localDayOffset, time.getDate())
    this.#frame.setUint8(localHourOffset, time.getHours())
    this.#frame.setUint8(localMinuteOffset, time.getMinutes())
    this.#frame.setUint8(localSecondOffset, time.getSeconds())
    this.#frame.setUint16(localMillisOffset, time.getMilliseconds(), true)
    this.#input.update(this.#frame)
    this.#input.postupdate() // to-do: move to postupdate()?
    this.#lastTime = now
  }
}

function debugDrawOn(): boolean {
  return (
    findDebugParam(location.href)
      ?.split(',')
      .some(str => str === 'draw=on') ?? false
  )
}

// to-do: decide on web vs Go split.
function setDrawOnParam(always: boolean): void {
  const csv =
    findDebugParam(location.href)
      ?.split(',')
      .filter(str => str && str !== 'draw=on') ?? []
  if (always) csv.push('draw=on') // to-do: use sette API? i think it handles all this.

  const oldURL = new URL(location.href)
  oldURL.searchParams.delete('debug')
  const params = []
  if (oldURL.searchParams.size) params.push(`${oldURL.searchParams}`)
  if (csv.length) params.push(`debug=${csv.join(',')}`)

  const newURL =
    oldURL.origin +
    oldURL.pathname +
    (params.length ? `?${params.join('&')}` : '') +
    oldURL.hash

  history.replaceState(history.state, '', newURL)
}

function findDebugParam(url: string): string | undefined {
  return [...new URL(url).searchParams].find(
    ([k]) => k.toLowerCase() === 'debug'
  )?.[1]
}
