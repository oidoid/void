import type {ButtonType, Trim, XYFlag} from '../ents/ent.ts'
import type {Tag} from '../graphics/atlas.ts'
import type {Layer} from '../graphics/layer.ts'
import type {Border, CompassDir, WH, XY} from '../types/geo.ts'

export type BorderSchema = number | Partial<XY> | Partial<Border>
export type ButtonSchema = {
  pressed: SpriteSchema | Tag
  selected: SpriteSchema | Tag
  type?: ButtonType
  z?: LayerSchema
}
// biome-ignore lint/suspicious/noEmptyInterface:;
export interface CamSchema {}
export type CursorSchema = {keyboard?: number; pick?: Tag}
export type DebugInputSchema = object
// biome-ignore lint/suspicious/noEmptyInterface:;
export interface DrawSchema {}
export interface EntSchema {
  button?: ButtonSchema
  cam?: CamSchema
  cursor?: CursorSchema
  debugInput?: DebugInputSchema
  draw?: DrawSchema
  fps?: FPSSchema
  hud?: HUDSchema
  id?: string
  name?: string
  ninePatch?: NinePatchSchema
  override?: OverrideSchema
  sprite?:
    | (SpriteSchema &
        Partial<WH> &
        Partial<XY> & {scale?: number | Partial<XY>})
    | Tag
  text?: string
  textWH?: TextWHSchema
  textXY?: TextXYSchema
}
export type FPSSchema = object
export type HUDSchema = {
  fill?: XYFlag
  margin?: BorderSchema
  modulo?: number | Partial<XY>
  origin: CompassDir
}
export type LayerSchema = keyof typeof Layer
export type LevelSchema = {
  $schema?: string
  ents?: EntSchema[]
  keepZoo?: boolean
  minWH?: UnboundedWHSchema
}
export type NinePatchSchema = {
  border?: BorderSchema
  pad?: BorderSchema
  patch: {[dir in Lowercase<CompassDir>]?: SpriteSchema | Tag}
}
export type OverrideSchema = {invalid?: boolean}
export type PoolSchema = 'Default' | string
export type SpriteSchema = {
  flip?: XYFlag
  pool?: PoolSchema
  stretch?: boolean
  tag?: Tag
  visible?: boolean
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
