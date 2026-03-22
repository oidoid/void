
export type WasmAPI = {
  /** linear memory shared between Go and JS. */
  memory: WebAssembly.Memory;
  /** initialises the Go runtime and calls `main()`. */
  _start(): void;
  /** byte offset into `memory` of the update. */
  GetUpdatePointer(): number;
  Update(): Loop;
};

export type Loop = typeof LoopPause | typeof LoopLoop;
export const LoopPause = 0 as const;
export const LoopLoop = 1 as const;
