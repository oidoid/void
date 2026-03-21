import { WASIHost } from "./wasi-host";
import { LoopLoop, type WasmAPI } from "./wasm-api";


export class Engine {
  #pointerX: number = 0
  #pointerY: number = 0
  #rafId: number = 0
  #registered: boolean = false
  #update!: DataView
  #wasm!: WasmAPI

  // to-do: use Wasm import.
  async load(wasmURL: string): Promise<void> {
    const wasi = new WASIHost();
    const result = await WebAssembly.instantiateStreaming(fetch(wasmURL), {
      wasi_snapshot_preview1: wasi,
    });
    this.#wasm = result.instance.exports as WasmAPI;
    wasi.link(this.#wasm.memory);
    this.#update = new DataView(this.#wasm.memory.buffer, this.#wasm.GetUpdatePointer(), 8);
  }

  register(): void {
    if (this.#registered) return
    this.#wasm._start();
    addEventListener('pointermove', (ev: PointerEvent) => {
      this.#pointerX = ev.clientX;
      this.#pointerY = ev.clientY;
      this.#requestUpdate()
    });
    this.#registered = true;
    this.update()
  }

  update(): void {
    this.#rafId = 0
    this.#requestUpdate()
    this.#writeUpdate();
    if (this.#wasm.Update() !== LoopLoop) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = 0
    }
  }

  #requestUpdate(): void {
    this.#rafId ||= requestAnimationFrame(() => this.update());
  }

  #writeUpdate(): void {
    if (this.#update.buffer !== this.#wasm.memory.buffer)
      this.#update = new DataView(this.#wasm.memory.buffer, this.#wasm.GetUpdatePointer(), 8);
    this.#update.setFloat32(0, this.#pointerX, true);
    this.#update.setFloat32(4, this.#pointerY, true);
  }
}
