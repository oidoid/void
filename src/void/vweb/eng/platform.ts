import type {LoopLoop, LoopPause} from './bridge.ts'

export type Loop = typeof LoopPause | typeof LoopLoop

export type Platform = {
  memory: WebAssembly.Memory
  // initializes the Go runtime and calls main().
  _start(): void
  PollPtr(): number
  OutPtr(): number
  Update(): Loop
}
