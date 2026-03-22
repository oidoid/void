import { WASIHost } from "./wasi-host";
import { Input } from "../input/input";
import { LoopLoop, type WasmAPI } from "./wasm-api";


export class Engine {
  #input: Input = new Input()
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
    this.#update = new DataView(this.#wasm.memory.buffer, this.#wasm.GetUpdatePointer(), 28);
  }

  register(): void {
    if (this.#registered) return
    this.#wasm._start();
    this.#input.onEvent = () => this.#requestUpdate();
    this.#input.register('add');
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
      this.#update = new DataView(this.#wasm.memory.buffer, this.#wasm.GetUpdatePointer(), 28);
    this.#input.write(this.#update);
  }
}
