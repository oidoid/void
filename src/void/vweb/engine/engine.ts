import {Input} from '../input/input.ts'
import {
  canvasHOffset,
  canvasWOffset,
  deltaMsOffset,
  drawMsOffset,
  isFullscreenOffset,
  nowMsOffset,
  updateByteLen
} from '../input/layout.ts'
import {Renderer} from '../renderer/renderer.ts'
import {initCanvas} from '../utils/canvas-util.ts'
import {initBody} from '../utils/dom-util.ts'
import {isFullscreen} from '../utils/fullscreen-util.ts'
import {
  type LayerCamMode,
  type LayerConfig,
  type LayerRenderMode,
  layerCamModeFixed,
  layerConfigCamModeOffset,
  layerConfigClipHPhyOffset,
  layerConfigClipWPhyOffset,
  layerConfigClipXPhyOffset,
  layerConfigClipYPhyOffset,
  layerConfigNoDepthOffset,
  layerConfigRenderModeOffset,
  layerConfigScaleOffset,
  layerConfigShaderOffset,
  layerConfigSpriteCountOffset,
  layerConfigSpritesPtrOffset,
  layerConfigStride,
  layerCount,
  type Shader,
  shaderSprites,
  shaderTiles
} from './layout.ts'
import {LoopLoop, type Platform} from './platform.ts'
import {WASI} from './wasi.ts'

export class Engine {
  #canvas!: HTMLCanvasElement
  #drawMs: number = 0
  #frame!: DataView
  #input!: Input
  #lastTime: number = 0
  #rafId: number = 0
  #registered: boolean = false
  #renderer!: Renderer
  #wasm!: Platform

  // to-do: use Wasm import.
  async load(
    canvas: HTMLCanvasElement | undefined | null,
    wasmURL: string
  ): Promise<void> {
    canvas = initCanvas(canvas, 'Float') // to-do: pass render mode.

    this.#input = new Input(canvas)
    const wasi = new WASI()
    const result = await WebAssembly.instantiateStreaming(fetch(wasmURL), {
      wasi_snapshot_preview1: wasi
    })
    this.#wasm = result.instance.exports as Platform
    wasi.link(this.#wasm.memory)
    this.#wasm._start()
    this.#frame = new DataView(
      this.#wasm.memory.buffer,
      this.#wasm.FramePointer(),
      updateByteLen
    )

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
    this.#requestUpdate()
    this.#renderer.resize()
    this.#writeUpdate()
    if (this.#wasm.Update() !== LoopLoop) {
      cancelAnimationFrame(this.#rafId)
      this.#rafId = 0
      this.#lastTime = 0
    }
    const drawStart = performance.now()
    const buffer = this.#wasm.memory.buffer
    const layerConfigPtr = this.#wasm.LayerConfigsPointer()
    const layerConfigView = new DataView(buffer)
    const camX = this.#wasm.CamX()
    const camY = this.#wasm.CamY()
    this.#renderer.clear()
    for (let layer = 0; layer < layerCount; layer++) {
      const config = this.#layerConfig(layerConfigView, layerConfigPtr, layer)
      const lx = config.camMode === layerCamModeFixed ? 0 : camX
      const ly = config.camMode === layerCamModeFixed ? 0 : camY
      if (config.shader === shaderTiles) {
        this.#renderer.drawTiles(
          lx,
          ly,
          config.scale,
          config.renderMode,
          config.noDepth,
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
          config.renderMode,
          config.noDepth,
          config.clipPhy
        )
      }
    }
    this.#drawMs = performance.now() - drawStart
  }

  #layerConfig(view: DataView, ptr: number, layer: number): LayerConfig {
    const o = ptr + layer * layerConfigStride
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
      shader: view.getUint8(o + layerConfigShaderOffset) as Shader,
      noDepth: view.getUint8(o + layerConfigNoDepthOffset) !== 0,
      spritesPtr: view.getUint32(o + layerConfigSpritesPtrOffset, true),
      spriteCount: view.getUint32(o + layerConfigSpriteCountOffset, true)
    }
  }

  #requestUpdate(): void {
    if (this.#rafId) return
    this.#rafId = requestAnimationFrame(() => this.update())
    this.#lastTime ||= performance.now()
  }

  #onContextLost = (ev: Event): void => {
    ev.preventDefault()
    cancelAnimationFrame(this.#rafId)
    this.#rafId = 0
    this.#lastTime = 0
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
    this.#frame.setFloat64(nowMsOffset, performance.timeOrigin + now, true)
    this.#frame.setUint16(canvasWOffset, this.#renderer.canvasW, true)
    this.#frame.setUint16(canvasHOffset, this.#renderer.canvasH, true)
    this.#frame.setUint8(isFullscreenOffset, isFullscreen() ? 1 : 0)
    this.#frame.setFloat64(drawMsOffset, this.#drawMs, true)
    this.#input.update(this.#frame)
    this.#input.postupdate() // to-do: move to postupdate()?
    this.#lastTime = now
  }
}
