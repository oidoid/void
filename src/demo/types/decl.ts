import type * as V from '../../engine/index.ts'
import type {
  Clock,
  MouseStatus,
  RenderToggle,
  Rotate,
  ScreenshotButton,
  Superball,
  SuperballButton,
  Tally
} from '../ents/ent.ts'
import type {
  ClockSchema,
  MouseStatusSchema,
  RenderToggleSchema,
  RotateSchema,
  ScreenshotButtonSchema,
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
    mouseStatus?: MouseStatus
    renderToggle?: RenderToggle
    rotate?: Rotate
    screenshotButton?: ScreenshotButton
    tally?: Tally
    superball?: Superball
    superballButton?: SuperballButton
  }

  interface EntSchema {
    clock?: ClockSchema
    mouseStatus?: MouseStatusSchema
    renderToggle?: RenderToggleSchema
    rotate?: RotateSchema
    screenshotButton?: ScreenshotButtonSchema
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
