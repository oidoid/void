import type * as V from '../../index.ts'

declare module '../../index.ts' {
  // biome-ignore lint/correctness/noUnusedVariables:;
  export interface EntSchema<Tag extends V.AnyTag> {
    clock?: ClockSchema
    debugInput?: DebugInputSchema
    renderToggle?: RenderToggleSchema
    tally?: TallySchema
  }
}

type ClockSchema = true
type DebugInputSchema = true
type RenderToggleSchema = true
type TallySchema = true
