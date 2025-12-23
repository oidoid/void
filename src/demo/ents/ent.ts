import type * as V from '../../index.ts'

declare module '../../index.ts' {
  // biome-ignore lint/correctness/noUnusedVariables:;
  interface Ent<Tag extends V.AnyTag> {
    clock: Clock
    debugInput: DebugInput
    renderToggle: RenderToggle
    tally: Tally
  }
}

export type Clock = true
export type DebugInput = true
export type RenderToggle = true
export type Tally = {updates: number}
