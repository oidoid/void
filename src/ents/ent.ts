import type {AnimTag} from '../graphics/atlas.ts'
import type {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import type {TextLayout} from '../text/text-layout.ts'
import type {Border, Box, CompassDir, XY} from '../types/geo.ts'

export interface Ent {
  button?: Button
  cursor?: Cursor
  hud?: HUD
  id?: string
  /**
   * recompute and render update if true. ok to set from anywhere but zoo or
   * override must clear. ents read invalid to test if an update is necessary.
   * ents write invalid to flag rendering and recompute by other systems. ents
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

export type Button = {
  started: boolean
  // to-do: naming?
  pressed: Sprite
  selected: Sprite
  type: ButtonType
}

export type ButtonType = 'Button' | 'Toggle'

export type Cursor = {
  /** screen area cursor may move within. */
  bounds: Box
  keyboard: number
  pick?: AnimTag
  point: AnimTag
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
