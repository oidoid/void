import type {Tag} from '../graphics/atlas.ts'
import type {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import type {TextLayout} from '../text/text-layout.ts'
import type {Border, Box, CompassDir, XY} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'

export type Anchor = {
  dir: CompassDir
  id: string
  margin: XY
  ref: Ent | undefined
}

export type Button = {
  started: boolean
  // to-do: naming?
  pressed: Sprite
  selected: Sprite
  type: ButtonType
}

export type ButtonType = 'Button' | 'Toggle'

export type CamStatus = object

export type DebugLoseContextButton = {end: number}

export type Cursor = {
  /** screen area cursor may move within. */
  bounds: Box
  /** if greater than zero, follow keyboard movement in pixels per second. */
  keyboard: number
  pick?: Tag
  point: Tag
}

export type DebugInput = object

/**
 * it doesn't really make sense for ents to be classes because their shared
 * independent prop bags still need to be passed in.
 */
export interface Ent {
  anchor?: Anchor
  button?: Button
  camStatus?: CamStatus
  cursor?: Cursor
  debugInput?: DebugInput
  debugLoseContextButton?: DebugLoseContextButton
  fps?: FPS
  fullscreenToggle?: FullscreenToggle
  hud?: HUD
  id?: string
  /**
   * frame timestamp (`v.tick.start`) when this ent was last updated
   * (preferred), or `Infinity` to force update every frame, or `0` to suppress
   * updates. ents write `v.tick.start` after mutating to flag rendering and
   * recompute by other hooks. ents may read another ent's `invalid` to
   * determine whether it was updated in the current frame
   * (`const updated = ref.invalid >= v.tick.start`).
   */
  invalid: Millis | typeof Infinity
  name?: string
  ninePatch?: NinePatch
  override?: Override
  sprite?: Sprite
  text?: string
  textWH?: TextWH
  textXY?: TextXY
  zooStatus?: ZooStatus
}

export type FPS = {
  prevFrames: number
  next: {created: Millis; startClears: number}
}

export type FullscreenToggle = {noLock: boolean}

export type HUD = {
  anchor: CompassDir
  fill?: XYFlag
  margin: Border
  modulo: XY
}

export type NinePatch = {
  border: Border
  pad: Border
  patch: {[dir in Lowercase<CompassDir>]?: Sprite}
}

export type Override = {invalid?: boolean}

export type TextWH = {
  maxW: number
  layout: TextLayout
  pad: Border
  scale: number
  trim: Trim | undefined
}

export type Trim = 'Leading' | 'Descender'

export type TextXY = {chars: Sprite[]; z: Layer}

export type XYFlag = 'XY' | 'X' | 'Y'

export type ZooStatus = object
