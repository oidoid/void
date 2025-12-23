import '../../index.ts'

declare module '../../index.ts' {
  export interface EntSchema {
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
