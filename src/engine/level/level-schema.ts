import type {ButtonType, Trim, XYFlag} from '../ents/ent.ts'
import type {Tag} from '../graphics/atlas.ts'
import type {Layer} from '../graphics/layer.ts'
import type {Border, CompassDir, WH, XY} from '../types/geo.ts'

export type BorderSchema = number | Partial<XY> | Partial<Border>
export type ButtonSchema = {
  pressed: SpritePropsSchema | Tag
  selected: SpritePropsSchema | Tag
  type?: ButtonType
  z?: LayerSchema
}
export interface CamConfigSchema {
  minScale?: number
  minWH?: UnboundedWHSchema
  x?: number
  y?: number
  zoomOut?: number
}
// biome-ignore lint/suspicious/noEmptyInterface:;
export interface CamDataSchema {}
export type CursorSchema = {keyboard?: number; pick?: Tag}
export type DebugInputSchema = object
export type DebugLoseContextButtonSchema = object
// biome-ignore lint/suspicious/noEmptyInterface:;
export interface DrawSchema {}
export type FullscreenToggleSchema = object
export interface EntSchema {
  button?: ButtonSchema
  cam?: CamDataSchema
  cursor?: CursorSchema
  debugInput?: DebugInputSchema
  debugLoseContextButton?: DebugLoseContextButtonSchema
  draw?: DrawSchema
  fps?: FPSSchema
  fullscreenToggle?: FullscreenToggleSchema
  hud?: HUDSchema
  id?: string
  name?: string
  ninePatch?: NinePatchSchema
  override?: OverrideSchema
  sprite?: SpriteSchema | Tag
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
export type LevelConfigSchema = {
  h: number
  tiles?: number[]
  w: number
  x?: number
  y?: number
}
export type LevelSchema = {
  $schema?: string
  background?: string
  cam?: CamConfigSchema
  level?: LevelConfigSchema
  zoo: {default: EntSchema[]; [list: string]: EntSchema[]}
}
export type NinePatchSchema = {
  border?: BorderSchema
  pad?: BorderSchema
  patch: {[dir in Lowercase<CompassDir>]?: SpritePropsSchema | Tag}
}
export type OverrideSchema = {invalid?: boolean}
export type PoolSchema = 'Default' | string
export type SpritePropsSchema = {
  flip?: XYFlag
  hidden?: boolean
  pool?: PoolSchema
  stretch?: boolean
  tag?: Tag
  z?: LayerSchema
  zend?: boolean
}
export type SpriteSchema = SpritePropsSchema & {
  angle?: number
  scale?: number | Partial<XY>
} & Partial<WH> &
  Partial<XY>
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
