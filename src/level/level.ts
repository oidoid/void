import type {
  Button,
  ButtonType,
  Cursor,
  Ent,
  HUD,
  NinePatch,
  TextUI,
  XYFlag
} from '../ents/ent.ts'
import type {AnyTag} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import {drawableMaxWH, type Sprite} from '../graphics/sprite.ts'
import type {Pool} from '../mem/pool.ts'
import type {PoolMap} from '../mem/pool-map.ts'
import type {Border, CompassDir, WH, XY} from '../types/geo.ts'
import {uncapitalize} from '../utils/str-util.ts'

export type Level<Tag extends AnyTag> = {
  ents: Ent<Tag>[]
  keepZoo: boolean
  minWH: WH
}

export type BorderSchema = number | Partial<XY> | Partial<Border>
export type ButtonSchema<Tag extends AnyTag> = {
  pressed: SpriteSchema<Tag> | Tag
  selected: SpriteSchema<Tag> | Tag
  type?: ButtonType
}
export interface EntSchema<Tag extends AnyTag> {
  button?: ButtonSchema<Tag>
  cursor?: CursorSchema<Tag>
  hud?: HUDSchema
  id?: string
  name?: string
  ninePatch?: NinePatchSchema<Tag>
  sprite?:
    | (SpriteSchema<Tag> &
        Partial<WH> &
        Partial<XY> & {scale?: number | Partial<XY>})
    | Tag
  text?: string
  textUI?: TextUISchema
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
export type PoolSchema = 'Default' | string
export type SpriteSchema<Tag extends AnyTag> = {
  flip?: XYFlag
  pool?: PoolSchema
  stretch?: boolean
  tag?: Tag
  z?: LayerSchema
  zend?: boolean
}
export type TextUISchema = {maxW?: number; origin?: CompassDir; scale?: number}
export type UnboundedWHSchema = {
  w?: number | 'Infinity'
  h?: number | 'Infinity'
}

export type ComponentHook<Tag extends AnyTag> = (
  json: Readonly<EntSchema<Tag>>,
  k: keyof EntSchema<Tag>,
  pools: Readonly<PoolMap<Tag>>
) => Ent<Tag>[typeof k]

export function parseLevel<Tag extends AnyTag>(
  json: Readonly<LevelSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>,
  hook: ComponentHook<Tag>
): Level<Tag> {
  return {
    ents: json.ents?.map(ent => parseEnt(ent, pools, hook)) ?? [],
    keepZoo: json.keepZoo ?? false,
    minWH: json.minWH ? parseWH(json.minWH) : {w: Infinity, h: Infinity}
  }
}

export function parseBorder(json: Readonly<BorderSchema> | undefined): Border {
  if (!json || typeof json === 'number') {
    const w = json ?? 0
    return {n: w, s: w, w, e: w}
  }
  if ('x' in json || 'y' in json)
    return {n: json.y ?? 0, s: json.y ?? 0, w: json.x ?? 0, e: json.x ?? 0}
  return {
    n: (json as Partial<Border>).n ?? 0,
    s: (json as Partial<Border>).s ?? 0,
    w: (json as Partial<Border>).w ?? 0,
    e: (json as Partial<Border>).e ?? 0
  }
}

export function parseButton<Tag extends AnyTag>(
  json: Readonly<ButtonSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>
): Button<Tag> {
  const pressed = parseSprite(json.pressed, pools)
  const selected = parseSprite(json.selected, pools)
  return {pressed, selected, type: json.type ?? 'Button'}
}

export function parseEnt<Tag extends AnyTag>(
  json: Readonly<EntSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>,
  hook: ComponentHook<Tag>
): Ent<Tag> {
  const ent: {[k: string]: Ent<Tag>[keyof Ent<Tag>]} = {}
  for (const _k in json) {
    const k = _k as keyof EntSchema<Tag>
    ent[k] = hook(json, k, pools) ?? parseEntComponent(json, k, pools)
  }
  return ent
}

export function parseEntComponent<Tag extends AnyTag>(
  json: Readonly<EntSchema<Tag>>,
  k: keyof EntSchema<Tag>,
  pools: Readonly<PoolMap<Tag>>
): Ent<Tag>[typeof k] {
  if (json[k] == null) return
  switch (k) {
    case 'button':
      return parseButton(json[k], pools) satisfies Ent<Tag>[typeof k]
    case 'cursor':
      return parseCursor(json[k]) satisfies Ent<Tag>[typeof k]
    case 'hud':
      return parseHUD(json[k]) satisfies Ent<Tag>[typeof k]
    case 'id':
    case 'name':
    case 'text':
      return json[k] satisfies Ent<Tag>[typeof k]
    case 'ninePatch':
      return parseNinePatch(json[k], pools) satisfies Ent<Tag>[typeof k]
    case 'sprite':
      return parseSprite(json[k], pools) satisfies Ent<Tag>[typeof k]
    case 'textUI':
      return parseTextUI(json[k]) satisfies Ent<Tag>[typeof k]
    default:
      k satisfies never
  }
}

export function parseNinePatch<Tag extends AnyTag>(
  json: Readonly<NinePatchSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>
): NinePatch<Tag> {
  const patch = {
    center:
      json.patch.center == null
        ? undefined
        : parseSprite(json.patch.center, pools),
    n: json.patch.n == null ? undefined : parseSprite(json.patch.n, pools),
    s: json.patch.s == null ? undefined : parseSprite(json.patch.s, pools),
    w: json.patch.w == null ? undefined : parseSprite(json.patch.w, pools),
    e: json.patch.e == null ? undefined : parseSprite(json.patch.e, pools),
    nw: json.patch.nw == null ? undefined : parseSprite(json.patch.nw, pools),
    ne: json.patch.ne == null ? undefined : parseSprite(json.patch.ne, pools),
    sw: json.patch.sw == null ? undefined : parseSprite(json.patch.sw, pools),
    se: json.patch.se == null ? undefined : parseSprite(json.patch.se, pools)
  }

  return {border: parseBorder(json.border), pad: parseBorder(json.pad), patch}
}

export function parseCursor<Tag extends AnyTag>(
  json: Readonly<CursorSchema<Tag>>
): Cursor<Tag> {
  return {keyboard: json.keyboard ?? 0, pick: json.pick}
}

export function parseHUD(json: Readonly<HUDSchema>): HUD {
  return {
    fill: json.fill,
    margin: parseBorder(json.margin ?? 0),
    modulo: parseXY(json.modulo ?? 0),
    origin: json.origin
  }
}

export function parseSprite<Tag extends AnyTag>(
  json:
    | Readonly<
        SpriteSchema<Tag> &
          Partial<WH> &
          Partial<XY> & {scale?: number | Partial<XY>}
      >
    | Tag,
  pools: Readonly<PoolMap<Tag>>
): Sprite<Tag> {
  const pool =
    typeof json === 'string' ? 'default' : uncapitalize(json.pool ?? 'Default')
  const _pools = pools as {[pool: string]: Pool<Sprite<Tag>>}
  if (!_pools[pool]) throw Error(`no ${pool} sprite pool`)
  const sprite = _pools[pool].alloc()
  if (typeof json === 'string') {
    sprite.tag = json
    sprite.visible = true
    return sprite
  }
  if (json.tag != null) sprite.tag = json.tag
  if (json.flip) {
    sprite.flipX = json.flip === 'X' || json.flip === 'XY'
    sprite.flipY = json.flip === 'Y' || json.flip === 'XY'
  }
  if (json.stretch != null) sprite.stretch = json.stretch
  if (json.w != null) sprite.w = json.w
  if (json.h != null) sprite.h = json.h
  if (json.scale != null) {
    sprite.w *=
      typeof json.scale === 'number' ? json.scale : (json.scale.x ?? 1)
    sprite.h *=
      typeof json.scale === 'number' ? json.scale : (json.scale.y ?? 1)
  }
  if (json.x != null) sprite.x = json.x
  if (json.y != null) sprite.y = json.y
  if (json.z != null) sprite.z = Layer[json.z]
  if (json.zend != null) sprite.zend = json.zend
  return sprite
}

export function parseTextUI(json: Readonly<TextUISchema>): TextUI {
  return {
    maxW: json.maxW ?? drawableMaxWH.w,
    origin: json.origin ?? 'Center',
    scale: json.scale ?? 1
  }
}

export function parseWH(json: Readonly<UnboundedWHSchema> | number): WH {
  if (typeof json === 'number') return {w: json, h: json}
  return {w: Number(json?.w ?? 0), h: Number(json?.h ?? 0)}
}

export function parseXY(json: Readonly<Partial<XY>> | number): XY {
  if (typeof json === 'number') return {x: json, y: json}
  return {x: json.x ?? 0, y: json.y ?? 0}
}
