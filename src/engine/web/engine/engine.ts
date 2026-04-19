import {Input} from '../input/input.ts'
import {
  canvasHOffset,
  canvasWOffset,
  deltaMsOffset,
  nowMsOffset,
  updateByteLen
} from '../input/layout.ts'
import {Renderer} from '../renderer/renderer.ts'
import {initCanvas} from '../utils/canvas-util.ts'
import {initBody} from '../utils/dom-util.ts'
import {WASIHost} from './wasi-host.ts'
import {LoopLoop, type WasmAPI} from './wasm-api.ts'

export class Engine {
  #input!: Input
  #lastTime: number = 0
  #rafId: number = 0
  #registered: boolean = false
  #renderer!: Renderer
  #update!: DataView
  #wasm!: WasmAPI

  // to-do: use Wasm import.
  async load(
    canvas: HTMLCanvasElement | undefined | null,
    wasmURL: string
  ): Promise<void> {
    canvas = initCanvas(canvas, 'Float') // to-do: pass render mode.

    this.#input = new Input(canvas)
    const wasi = new WASIHost()
    const result = await WebAssembly.instantiateStreaming(fetch(wasmURL), {
      wasi_snapshot_preview1: wasi
    })
    this.#wasm = result.instance.exports as WasmAPI
    wasi.link(this.#wasm.memory)
    this.#wasm._start()
    this.#update = new DataView(
      this.#wasm.memory.buffer,
      this.#wasm.GetUpdatePointer(),
      updateByteLen
    )

    initBody()

    this.#renderer = new Renderer(
      canvas,
      this.#wasm.memory.buffer,
      this.#wasm.GetTilePointer(),
      this.#wasm.GetTileCount(),
      this.#wasm.GetLevelX(),
      this.#wasm.GetLevelY(),
      this.#wasm.GetLevelW(),
      this.#wasm.GetLevelH(),
      this.#wasm.GetLevelTileW(),
      this.#wasm.GetLevelTileH()
    )
  }

  register(): void {
    if (this.#registered) return
    this.#input.onEvent = () => this.#requestUpdate()
    this.#input.register('add')
    addEventListener('blur', this.#onReset)
    addEventListener('visibilitychange', this.#onReset)
    this.#registered = true
    this.update()
  }

  update(): void {
    this.#rafId = 0
    this.#requestUpdate()
    this.#renderer.resize()
    this.#writeUpdate()
    this.#renderer.draw(
      this.#wasm.memory.buffer,
      this.#wasm.GetSpritePointer(),
      this.#wasm.GetSpriteCount(),
      this.#wasm.GetCamX(),
      this.#wasm.GetCamY()
    )
    if (this.#wasm.Update() !== LoopLoop) {
      cancelAnimationFrame(this.#rafId)
      this.#rafId = 0
    }
  }

  #requestUpdate(): void {
    this.#rafId ||= requestAnimationFrame(() => this.update())
    this.#lastTime ||= performance.now()
  }

  #onReset = (): void => {
    this.#input.reset()
  }

  #writeUpdate(): void {
    if (this.#update.buffer !== this.#wasm.memory.buffer)
      this.#update = new DataView(
        this.#wasm.memory.buffer,
        this.#wasm.GetUpdatePointer(),
        updateByteLen
      )
    const now = performance.now()
    const delta = this.#lastTime === 0 ? 0 : now - this.#lastTime
    this.#update.setFloat64(deltaMsOffset, delta, true)
    this.#update.setFloat64(nowMsOffset, performance.timeOrigin + now, true)
    this.#update.setUint32(canvasWOffset, this.#renderer.canvasW, true)
    this.#update.setUint32(canvasHOffset, this.#renderer.canvasH, true)
    this.#input.update(this.#update)
    this.#input.postupdate() // to-do: move to postupdate()?
    this.#lastTime = 0
  }
}
