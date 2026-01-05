import type * as V from '../../index.ts'
// biome-ignore lint/correctness/useJsonImportAttributes:;
import type gameJSON from '../assets/void.game.json'
import type {Clock, RenderToggle, Tally} from '../ents/ent.ts'
import type {
  ClockSchema,
  RenderToggleSchema,
  TallySchema
} from '../level/level-schema.ts'

declare module '../../index.ts' {
  interface Debug {
    /** update the clock at least once a second instead of once a minute. */
    seconds?: string
  }

  interface Ent {
    clock?: Clock
    renderToggle?: RenderToggle
    tally?: Tally
  }

  interface EntSchema {
    clock?: ClockSchema
    renderToggle?: RenderToggleSchema
    tally?: TallySchema
  }

  interface PoolMap {
    overlay: V.Pool<V.Sprite>
  }

  interface ReturnTag {
    // biome-ignore lint/style/useShorthandFunctionType:;
    (): keyof typeof gameJSON.atlas.anim
  }
}
