import type { WASMAPI } from "./wasm-api";

/** exports exposed by the compiled WASM module. */
export type WASMExports = {
  /** linear memory shared between Go and JS. */
  memory: WebAssembly.Memory;
  /** WASI entry point; initialises the Go runtime. */
  _start(): void;
} & WASMAPI;

