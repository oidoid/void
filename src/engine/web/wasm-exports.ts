/** exports exposed by the compiled WASM module. */
export type WASMExports = {
  /** linear memory shared between Go and JS. */
  memory: WebAssembly.Memory;
  /** WASI entry point; initialises the Go runtime. */
  _start(): void;
} & VoidAPI;

export type VoidAPI = {
  Hello(): void;
}
