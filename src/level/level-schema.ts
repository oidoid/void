import type {ButtonType, Trim, XYFlag} from '../ents/ent.ts'
import type {AnyTag} from '../graphics/atlas.ts'
import type {Layer} from '../graphics/layer.ts'
import type {Border, CompassDir, WH, XY} from '../types/geo.ts'

export type BorderSchema = number | Partial<XY> | Partial<Border>
export type ButtonSchema<Tag extends AnyTag> = {
  pressed: SpriteSchema<Tag> | Tag
  selected: SpriteSchema<Tag> | Tag
  type?: ButtonType
  z?: LayerSchema
}
export interface EntSchema<Tag extends AnyTag> {
  button?: ButtonSchema<Tag>
  cursor?: CursorSchema<Tag>
  hud?: HUDSchema
  id?: string
  name?: string
  ninePatch?: NinePatchSchema<Tag>
  override?: OverrideSchema
  sprite?:
    | (SpriteSchema<Tag> &
        Partial<WH> &
        Partial<XY> & {scale?: number | Partial<XY>})
    | Tag
  text?: string
  textWH?: TextWHSchema
  textXY?: TextXYSchema
}
export type CursorSchema<Tag extends AnyTag> = {keyboard?: number; pick?: Tag}
export type HUDSchema = {
  fill?: XYFlag
  margin?: BorderSchema
  modulo?: number | Partial<XY>
  origin: CompassDir
}
export type LayerSchema = keyof typeof Layer
export type LevelSchema<Tag extends AnyTag> = {
  $schema?: string
  ents?: EntSchema<Tag>[]
  keepZoo?: boolean
  minWH?: UnboundedWHSchema
}
export type NinePatchSchema<Tag extends AnyTag> = {
  border?: BorderSchema
  pad?: BorderSchema
  patch: {[dir in Lowercase<CompassDir>]?: SpriteSchema<Tag> | Tag}
}
export type OverrideSchema = {invalid?: boolean}
export type PoolSchema = 'Default' | string
export type SpriteSchema<Tag extends AnyTag> = {
  flip?: XYFlag
  pool?: PoolSchema
  stretch?: boolean
  tag?: Tag
  z?: LayerSchema
  zend?: boolean
}
export type TextWHSchema = {
  maxW?: number
  pad?: BorderSchema
  scale?: number
  trim?: Trim
}
export type TextXYSchema = {z?: LayerSchema}
export type UnboundedWHSchema = {
  w?: number | 'Infinity'
  h?: number | 'Infinity'
}
