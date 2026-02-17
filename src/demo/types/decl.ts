import type * as V from '../../engine/index.ts'
import type {
  Clock,
  Fullscreen,
  RenderToggle,
  Rotate,
  Screenshot,
  Superball,
  SuperballButton,
  Tally
} from '../ents/ent.ts'
import type {
  ClockSchema,
  FullscreenSchema,
  RenderToggleSchema,
  RotateSchema,
  SuperballButtonSchema,
  SuperballSchema,
  TallySchema
} from '../level/level-schema.ts'
// biome-ignore lint/correctness/useJsonImportAttributes:;
import type tags from '../level/tags.json'

declare module '../../engine/index.ts' {
  interface Debug {
    /** update the clock at least once a second instead of once a minute. */
    seconds?: string
  }

  interface Ent {
    clock?: Clock
    fullscreen?: Fullscreen
    renderToggle?: RenderToggle
    rotate?: Rotate
    screenshot?: Screenshot
    tally?: Tally
    superball?: Superball
    superballButton?: SuperballButton
  }

  interface EntSchema {
    clock?: ClockSchema
    fullscreen?: FullscreenSchema
    renderToggle?: RenderToggleSchema
    rotate?: RotateSchema
    tally?: TallySchema
    superball?: SuperballSchema
    superballButton?: SuperballButtonSchema
  }

  interface PoolMap {
    overlay: V.Pool<V.Sprite>
  }

  interface ReturnTag {
    // biome-ignore lint/style/useShorthandFunctionType:;
    (): keyof typeof tags.tags
  }

  interface ReturnTile {
    // biome-ignore lint/style/useShorthandFunctionType:;
    (): keyof typeof tags.tiles
  }
}
