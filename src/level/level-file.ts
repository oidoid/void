import type {
  Button,
  ButtonType,
  Ent,
  FollowCam,
  NinePatch,
  TextUI,
  XYFlag
} from '../ents/ent.ts'
import type {FollowCursor} from '../ents/follow-cursor.ts'
import type {TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import {drawableMaxWH, type Sprite} from '../graphics/sprite.ts'
import type {Pool} from '../mem/pool.ts'
import type {PoolMap} from '../mem/pool-map.ts'
import type {CardinalDir, CompassDir, WH, XY} from '../types/geo.ts'
import {uncapitalize} from '../utils/str-util.ts'

export type Level<Tag extends TagFormat> = {
  ents: Ent<Tag>[]
  keepZoo: boolean
  minWH: WH
}

export type ButtonSchema<Tag extends TagFormat> = {
  pressed?: SpriteSchema<Tag> | Tag
  selected?: SpriteSchema<Tag> | Tag
  type?: ButtonType
}
export interface EntSchema<Tag extends TagFormat> {
  button?: ButtonSchema<Tag>
  followCam?: FollowCamSchema
  followCursor?: FollowCursorSchema<Tag>
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
export type FollowCamSchema = {
  dir: CompassDir
  fill?: XYFlag
  margin?: number | Partial<WH>
  modulo?: number | Partial<XY>
}
export type FollowCursorSchema<Tag extends TagFormat> = {
  keyboard?: number
  pick?: Tag
}
export type LayerSchema = keyof typeof Layer
export type LevelSchema<Tag extends TagFormat> = {
  $schema?: string
  ents?: EntSchema<Tag>[]
  keepZoo?: boolean
  minWH?: UnboundedWHSchema
}
export type NinePatchSchema<Tag extends TagFormat> = {
  border?: number | {[dir in Lowercase<CardinalDir>]: number}
  margin?: number | Partial<WH>
  patch: {[dir in Lowercase<CompassDir>]?: SpriteSchema<Tag> | Tag}
}
export type PoolSchema = 'Default' | string
export type SpriteSchema<Tag extends TagFormat> = {
  flip?: XYFlag
  pool?: PoolSchema
  stretch?: boolean
  tag?: Tag
  z?: LayerSchema
  zend?: boolean
}
export type TextUISchema = {dir?: CompassDir; maxW?: number; scale?: number}
export type UnboundedWHSchema = {
  w?: number | 'Infinity'
  h?: number | 'Infinity'
}

export function parseLevel<Tag extends TagFormat>(
  json: Readonly<LevelSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>,
  hook: (
    json: Readonly<EntSchema<Tag>>,
    pools: Readonly<PoolMap<Tag>>,
    k: keyof EntSchema<Tag>
  ) => Ent<Tag>[typeof k]
): Level<Tag> {
  return {
    ents: json.ents?.map(ent => parseEnt(ent, pools, hook)) ?? [],
    keepZoo: json.keepZoo ?? false,
    minWH: json.minWH ? parseWH(json.minWH) : {w: Infinity, h: Infinity}
  }
}

export function parseButton<Tag extends TagFormat>(
  json: Readonly<ButtonSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>
): Button<Tag> {
  const pressed =
    json.pressed == null ? undefined : parseSprite(json.pressed, pools)
  const selected =
    json.selected == null ? undefined : parseSprite(json.selected, pools)
  return {pressed, selected, type: json.type ?? 'Button'}
}

/** @internal */
export function parseEnt<Tag extends TagFormat>(
  json: Readonly<EntSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>,
  hook: (
    json: Readonly<EntSchema<Tag>>,
    pools: Readonly<PoolMap<Tag>>,
    k: keyof EntSchema<Tag>
  ) => Ent<Tag>[typeof k]
): Ent<Tag> {
  const ent: {[k: string]: Ent<Tag>[keyof Ent<Tag>]} = {}
  for (const _k in json) {
    const k = _k as keyof EntSchema<Tag>
    ent[k] = hook(json, pools, k) ?? parseEntComponent(json, pools, k)
  }
  return ent
}

export function parseEntComponent<Tag extends TagFormat>(
  json: Readonly<EntSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>,
  k: keyof EntSchema<Tag>
): Ent<Tag>[typeof k] {
  if (json[k] == null) return
  switch (k) {
    case 'button':
      return parseButton(json[k], pools) satisfies Ent<Tag>[typeof k]
    case 'followCam':
      return parseFollowCam(json[k]) satisfies Ent<Tag>[typeof k]
    case 'followCursor':
      return parseFollowCursor(json[k]) satisfies Ent<Tag>[typeof k]
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

export function parseNinePatch<Tag extends TagFormat>(
  json: Readonly<NinePatchSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>
): NinePatch<Tag> {
  let border
  if (typeof json.border === 'object')
    border = {
      n: json.border.n ?? 0,
      s: json.border.s ?? 0,
      w: json.border.w ?? 0,
      e: json.border.e ?? 0
    }
  else {
    const w = json.border ?? 0
    border = {n: w, s: w, w: w, e: w}
  }

  const margin = parseWH(json.margin ?? 0)

  const patch = {
    origin:
      json.patch.origin == null
        ? undefined
        : parseSprite(json.patch.origin, pools),
    n: json.patch.n == null ? undefined : parseSprite(json.patch.n, pools),
    s: json.patch.s == null ? undefined : parseSprite(json.patch.s, pools),
    w: json.patch.w == null ? undefined : parseSprite(json.patch.w, pools),
    e: json.patch.e == null ? undefined : parseSprite(json.patch.e, pools),
    nw: json.patch.nw == null ? undefined : parseSprite(json.patch.nw, pools),
    ne: json.patch.ne == null ? undefined : parseSprite(json.patch.ne, pools),
    sw: json.patch.sw == null ? undefined : parseSprite(json.patch.sw, pools),
    se: json.patch.se == null ? undefined : parseSprite(json.patch.se, pools)
  }

  return {border, margin, patch}
}

export function parseFollowCursor<Tag extends TagFormat>(
  json: Readonly<FollowCursorSchema<Tag>>
): FollowCursor<Tag> {
  return {keyboard: json.keyboard ?? 0, pick: json.pick}
}

export function parseFollowCam(json: Readonly<FollowCamSchema>): FollowCam {
  return {
    dir: json.dir,
    fill: json.fill,
    margin: parseWH(json.margin ?? 0),
    modulo: parseXY(json.modulo ?? 0)
  }
}

export function parseSprite<Tag extends TagFormat>(
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
    dir: json.dir ?? 'Origin',
    maxW: json.maxW ?? drawableMaxWH.w,
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
