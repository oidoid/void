import { WASIHost } from "./wasi-host";
import type { WasmExports } from "./wasm-exports";


export class Void {
  #registered: boolean = false
  #wasm!: WasmExports

  // to-do: use Wasm import.
  async load(wasmURL: string): Promise<void> {
    const wasi = new WASIHost();
    const result = await WebAssembly.instantiateStreaming(fetch(wasmURL), {
      wasi_snapshot_preview1: wasi,
    });
    this.#wasm = result.instance.exports as WasmExports;
    wasi.link(this.#wasm.memory);
  }

  register(): void {
    if (this.#registered) return
    this.#wasm._start();
    this.#registered = true;
  }

  update(): void {
    this.#wasm.Update();
  }
}