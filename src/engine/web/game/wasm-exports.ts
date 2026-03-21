import type { WasmAPI } from "./wasm-api";

/** exports exposed by the compiled Wasm module. */
export type WasmExports = {
  /** linear memory shared between Go and JS. */
  memory: WebAssembly.Memory;
  /** WASI entry point; initialises the Go runtime. */
  _start(): void;
} & WasmAPI;

