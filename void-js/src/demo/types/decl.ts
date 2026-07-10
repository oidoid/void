import type * as V from '../../engine/index.ts'
import type {
  Clock,
  CollideToggle,
  MouseStatus,
  RenderToggle,
  Rotate,
  ScreenshotButton,
  SoundToggle,
  Superball,
  Tally
} from '../ents/ent.ts'
import type {SuperballEnt} from '../ents/superball.ts'
import type {
  ClockSchema,
  CollideToggleSchema,
  MouseStatusSchema,
  RenderToggleSchema,
  RotateSchema,
  ScreenshotButtonSchema,
  SoundToggleSchema,
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
    collideToggle?: CollideToggle
    mouseStatus?: MouseStatus
    renderToggle?: RenderToggle
    rotate?: Rotate
    screenshotButton?: ScreenshotButton
    soundToggle?: SoundToggle
    tally?: Tally
    superball?: Superball
  }

  interface EntSchema {
    clock?: ClockSchema
    collideToggle?: CollideToggleSchema
    mouseStatus?: MouseStatusSchema
    renderToggle?: RenderToggleSchema
    rotate?: RotateSchema
    screenshotButton?: ScreenshotButtonSchema
    soundToggle?: SoundToggleSchema
    tally?: TallySchema
    superball?: SuperballSchema
  }

  interface Loader {
    collide: boolean
    sound: boolean
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

  interface Zoo {
    coords: Set<Ent>
    superballs: Set<SuperballEnt>
  }
}
