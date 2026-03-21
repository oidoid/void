
export type WasmAPI = {
  /** linear memory shared between Go and JS. */
  memory: WebAssembly.Memory;
  /** WASI entry point; initialises the Go runtime. */
  _start(): void;
  Update(): void;
};
