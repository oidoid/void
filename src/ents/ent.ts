import type {AnyTag} from '../graphics/atlas.ts'
import type {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import type {TextLayout} from '../text/text-layout.ts'
import type {Border, Box, CompassDir, XY} from '../types/geo.ts'

export interface Ent<Tag extends AnyTag> {
  button?: Button<Tag>
  cursor?: Cursor<Tag>
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
  ninePatch?: NinePatch<Tag>
  override?: Override
  sprite?: Sprite<Tag>
  text?: string
  textWH?: TextWH
  textXY?: TextXY<Tag>
}

export type Button<Tag extends AnyTag> = {
  started: boolean
  // to-do: naming?
  pressed: Sprite<Tag>
  selected: Sprite<Tag>
  type: ButtonType
}

export type ButtonType = 'Button' | 'Toggle'

export type Cursor<Tag extends AnyTag> = {
  /** screen area cursor may move within. */
  bounds: Box
  keyboard: number
  pick?: Tag
  point: Tag
}

export type HUD = {
  fill?: XYFlag
  margin: Border
  modulo: XY
  origin: CompassDir
}

export type NinePatch<Tag extends AnyTag> = {
  border: Border
  pad: Border
  patch: {[dir in Lowercase<CompassDir>]?: Sprite<Tag>}
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

export type TextXY<Tag extends AnyTag> = {chars: Sprite<Tag>[]; z: Layer}

export type XYFlag = 'XY' | 'X' | 'Y'
