import type * as V from '../../index.ts'
import type {Cam, Clock, Draw, RenderToggle, Tally} from '../ents/ent.ts'
import type {
  CamSchema,
  ClockSchema,
  DrawSchema,
  RenderToggleSchema,
  TallySchema
} from '../level/level-schema.ts'
import type {Tag} from './tag.ts'

declare module '../../index.ts' {
  interface Debug {
    /** update the clock at least once a second instead of once a minute. */
    seconds?: string
  }

  interface Ent {
    cam?: Cam
    clock?: Clock
    draw?: Draw
    renderToggle?: RenderToggle
    tally?: Tally
  }

  interface EntSchema {
    cam?: CamSchema
    clock?: ClockSchema
    draw?: DrawSchema
    renderToggle?: RenderToggleSchema
    tally?: TallySchema
  }

  interface Loader {
    level: undefined | 'Init'
  }

  interface PoolMap {
    overlay: V.Pool<V.Sprite>
  }

  interface Sprite {
    getTag(): Tag
    setTag(tag: Tag): void
  }
}
