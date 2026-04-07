import {Input} from '../input/input.ts'
import {deltaMsOffset, nowMsOffset, updateByteLen} from '../input/layout.ts'
import {Renderer} from '../renderer/renderer.ts'
import {initCanvas} from '../utils/canvas-util.ts'
import {WASIHost} from './wasi-host.ts'
import {LoopLoop, type WasmAPI} from './wasm-api.ts'

export class Engine {
  #canvas!: HTMLCanvasElement
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
    this.#update = new DataView(
      this.#wasm.memory.buffer,
      this.#wasm.GetUpdatePointer(),
      updateByteLen
    )

    canvas.width = document.documentElement.clientWidth
    canvas.height = document.documentElement.clientHeight
    this.#canvas = canvas
    this.#renderer = new Renderer(canvas)

    // to-do: move to resize method and call on init and then only as necessary.
    this.#renderer.resize(canvas.width, canvas.height)
  }

  register(): void {
    if (this.#registered) return
    this.#wasm._start()
    this.#wasm.SetCanvasWH(this.#canvas.width, this.#canvas.height)
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
    this.#writeUpdate()
    this.#renderer.draw(
      this.#wasm.memory.buffer,
      this.#wasm.GetSpritePointer(),
      this.#wasm.GetSpriteCount()
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
    this.#input.update(this.#update)
    this.#input.postupdate() // to-do: move to postupdate()?
    this.#lastTime = 0
  }
}
