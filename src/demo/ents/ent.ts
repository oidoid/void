declare module '../../index.ts' {
  interface Ent {
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
