import { WASIHost } from "./wasi-host";
import type { WasmAPI } from "./wasm-api";


export class Void {
  #pointerX: number = 0
  #pointerY: number = 0
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
      if(this.#registered) return
    this.#wasm._start();
      addEventListener('pointermove', (ev: PointerEvent) => {
      this.#pointerX = ev.clientX;
      this.#pointerY = ev.clientY;
    });
    this.#registered = true;
  }

  update(): void {
    if (this.#update.buffer !== this.#wasm.memory.buffer)
      this.#update = new DataView(this.#wasm.memory.buffer, this.#wasm.GetUpdatePointer(), 8);
    this.#writeUpdate();
    this.#wasm.Update();
  }

  #writeUpdate(): void {
    this.#update.setFloat32(0, this.#pointerX, true);
    this.#update.setFloat32(4, this.#pointerY, true);
  }
}
