import type {Tag} from '../graphics/atlas.ts'
import type {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import type {TextLayout} from '../text/text-layout.ts'
import type {Border, Box, CompassDir, XY} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'

export type Button = {
  started: boolean
  // to-do: naming?
  pressed: Sprite
  selected: Sprite
  type: ButtonType
}

export type ButtonType = 'Button' | 'Toggle'

// biome-ignore lint/suspicious/noEmptyInterface:;
export interface CamData {}

export type Cursor = {
  /** screen area cursor may move within. */
  bounds: Box
  keyboard: number
  pick?: Tag
  point: Tag
}

// biome-ignore lint/suspicious/noEmptyInterface:;
export interface Draw {}

export type DebugInput = object

/**
 * it doesn't really make sense for ents to be classes because their shared
 * independent component bags still need to be passed in.
 */
export interface Ent {
  button?: Button
  cam?: CamData
  cursor?: Cursor
  draw?: Draw
  debugInput?: DebugInput
  fps?: FPS
  hud?: HUD
  id?: string
  /**
   * recompute and render update if true. ok to set from anywhere but zoo or
   * override must clear. ents read invalid to test if an update is necessary.
   * ents write invalid to flag rendering and recompute by other hooks. ents
   * should not look at each other's invalid state since it's cleared on update.
   */
  invalid?: boolean
  name?: string
  ninePatch?: NinePatch
  override?: Override
  sprite?: Sprite
  text?: string
  textWH?: TextWH
  textXY?: TextXY
}

export type FPS = {
  prevFrames: number
  next: {created: Millis; startClears: number}
}

export type HUD = {
  fill?: XYFlag
  margin: Border
  modulo: XY
  origin: CompassDir
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
