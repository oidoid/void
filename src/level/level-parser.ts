import type {
  Button,
  Cursor,
  Ent,
  HUD,
  NinePatch,
  Override,
  TextWH,
  TextXY
} from '../ents/ent.ts'
import type {AnyTag, Atlas} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import {drawableMaxWH, type Sprite} from '../graphics/sprite.ts'
import type {PoolMap} from '../mem/pool-map.ts'
import type {Border, WH, XY} from '../types/geo.ts'
import {uncapitalize} from '../utils/str-util.ts'
import type {Level} from './level.ts'
import type {
  BorderSchema,
  ButtonSchema,
  CursorSchema,
  EntSchema,
  HUDSchema,
  LevelSchema,
  NinePatchSchema,
  OverrideSchema,
  SpriteSchema,
  TextWHSchema,
  TextXYSchema,
  UnboundedWHSchema
} from './level-schema.ts'

export type ComponentHook<Tag extends AnyTag> = (
  ent: Ent<Tag>,
  json: Readonly<EntSchema<Tag>>,
  k: keyof EntSchema<Tag>,
  pools: Readonly<PoolMap<Tag>>,
  atlas: Readonly<Atlas<Tag>>
) => Ent<Tag>[typeof k]

export function parseLevel<Tag extends AnyTag>(
  json: Readonly<LevelSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>,
  hook: ComponentHook<Tag>,
  atlas: Readonly<Atlas<Tag>>
): Level<Tag> {
  return {
    ents: json.ents?.map(ent => parseEnt(ent, pools, hook, atlas)) ?? [],
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
  pools: Readonly<PoolMap<Tag>>,
  atlas: Readonly<Atlas<Tag>>
): Button<Tag> {
  const pressed = parseSprite(json.pressed, pools, atlas)
  if (json.z) pressed.z = Layer[json.z]
  pressed.visible = false // button state is based on visibility.
  const selected = parseSprite(json.selected, pools, atlas)
  if (json.z) selected.z = Layer[json.z]
  return {pressed, selected, started: false, type: json.type ?? 'Button'}
}

export function parseCursor<Tag extends AnyTag>(
  ent: Ent<Tag>,
  json: Readonly<CursorSchema<Tag>>
): Cursor<Tag> {
  if (!ent.sprite) throw Error('cursor missing sprite')
  return {
    bounds: {x: 0, y: 0, w: 0, h: 0},
    keyboard: json.keyboard ?? 0,
    pick: json.pick,
    point: ent.sprite.tag
  }
}

export function parseEnt<Tag extends AnyTag>(
  json: Readonly<EntSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>,
  hook: ComponentHook<Tag>,
  atlas: Readonly<Atlas<Tag>>
): Ent<Tag> {
  const ent: {[k: string]: Ent<Tag>[keyof Ent<Tag>]} = {}
  for (const _k in json) {
    const k = _k as keyof EntSchema<Tag>
    ent[k] =
      hook(ent, json, k, pools, atlas) ??
      parseEntComponent(ent, json, k, pools, atlas)
  }
  ent.invalid = true
  return ent
}

export function parseEntComponent<Tag extends AnyTag>(
  ent: Ent<Tag>,
  json: Readonly<EntSchema<Tag>>,
  k: keyof EntSchema<Tag>,
  pools: Readonly<PoolMap<Tag>>,
  atlas: Readonly<Atlas<Tag>>
): Ent<Tag>[typeof k] {
  if (json[k] == null) return
  switch (k) {
    case 'button':
      return parseButton(json[k], pools, atlas) satisfies Ent<Tag>[typeof k]
    case 'cursor':
      return parseCursor(ent, json[k]) satisfies Ent<Tag>[typeof k]
    case 'hud':
      return parseHUD(json[k]) satisfies Ent<Tag>[typeof k]
    case 'id':
    case 'name':
    case 'text':
      return json[k] satisfies Ent<Tag>[typeof k]
    case 'ninePatch':
      return parseNinePatch(
        ent,
        json[k],
        pools,
        atlas
      ) satisfies Ent<Tag>[typeof k]
    case 'override':
      return parseOverride(json[k]) satisfies Ent<Tag>[typeof k]
    case 'sprite':
      return parseSprite(json[k], pools, atlas) satisfies Ent<Tag>[typeof k]
    case 'textWH':
      return parseTextWH(json[k]) satisfies Ent<Tag>[typeof k]
    case 'textXY':
      return parseTextXY(ent, json[k]) satisfies Ent<Tag>[typeof k]
    default:
      k satisfies never
  }
}

export function parseHUD(json: Readonly<HUDSchema>): HUD {
  return {
    fill: json.fill,
    margin: parseBorder(json.margin ?? 0),
    modulo: parseXY(json.modulo ?? 0),
    origin: json.origin
  }
}

export function parseNinePatch<Tag extends AnyTag>(
  ent: Ent<Tag>,
  json: Readonly<NinePatchSchema<Tag>>,
  pools: Readonly<PoolMap<Tag>>,
  atlas: Readonly<Atlas<Tag>>
): NinePatch<Tag> {
  if (!ent.sprite) throw Error('nine patch missing sprite')
  const patch = {
    center:
      json.patch.center == null
        ? undefined
        : parseSprite(json.patch.center, pools, atlas),
    n:
      json.patch.n == null
        ? undefined
        : parseSprite(json.patch.n, pools, atlas),
    s:
      json.patch.s == null
        ? undefined
        : parseSprite(json.patch.s, pools, atlas),
    w:
      json.patch.w == null
        ? undefined
        : parseSprite(json.patch.w, pools, atlas),
    e:
      json.patch.e == null
        ? undefined
        : parseSprite(json.patch.e, pools, atlas),
    nw:
      json.patch.nw == null
        ? undefined
        : parseSprite(json.patch.nw, pools, atlas),
    ne:
      json.patch.ne == null
        ? undefined
        : parseSprite(json.patch.ne, pools, atlas),
    sw:
      json.patch.sw == null
        ? undefined
        : parseSprite(json.patch.sw, pools, atlas),
    se:
      json.patch.se == null
        ? undefined
        : parseSprite(json.patch.se, pools, atlas)
  }
  const border = parseBorder(json.border)
  const ninePatch = {border, pad: parseBorder(json.pad), patch}
  if (patch.center) patch.center.z = ent.sprite.z
  if (patch.n) {
    patch.n.h = border.n
    patch.n.z = ent.sprite.z
  }
  if (patch.s) {
    patch.s.h = border.s
    patch.s.z = ent.sprite.z
  }
  if (patch.w) {
    patch.w.w = border.w
    patch.w.z = ent.sprite.z
  }
  if (patch.e) {
    patch.e.w = border.e
    patch.e.z = ent.sprite.z
  }
  if (patch.nw) {
    patch.nw.w = border.w
    patch.nw.h = border.n
    patch.nw.z = ent.sprite.z
  }
  if (patch.ne) {
    patch.ne.w = border.e
    patch.ne.h = border.n
    patch.ne.z = ent.sprite.z
  }
  if (patch.sw) {
    patch.sw.w = border.w
    patch.sw.h = border.s
    patch.sw.z = ent.sprite.z
  }
  if (patch.se) {
    patch.se.w = border.e
    patch.se.h = border.s
    patch.se.z = ent.sprite.z
  }
  return ninePatch
}

export function parseOverride(json: Readonly<OverrideSchema>): Override {
  return {invalid: json.invalid}
}

export function parseSprite<Tag extends AnyTag>(
  json:
    | Readonly<
        SpriteSchema<Tag> &
          Partial<WH> &
          Partial<XY> & {scale?: number | Partial<XY>}
      >
    | Tag,
  pools: Readonly<PoolMap<Tag>>,
  atlas: Readonly<Atlas<Tag>>
): Sprite<Tag> {
  const pool =
    typeof json === 'string' ? 'default' : uncapitalize(json.pool ?? 'Default')
  if (!pools[pool as keyof PoolMap<Tag>]) throw Error(`no ${pool} sprite pool`)
  const sprite = pools[pool as keyof PoolMap<Tag>].alloc()
  if (typeof json === 'string') {
    if (!(json in atlas.anim)) throw Error(`no tag "${json}"`)
    sprite.tag = json
    sprite.visible = true // to-do: expose in schema but keep this default logic.
    return sprite
  }
  if (json.tag != null) {
    if (!(json.tag in atlas.anim)) throw Error(`no tag "${json.tag}"`)
    sprite.tag = json.tag
    sprite.visible = true // to-do: expose in schema but keep this default logic.
  }
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

export function parseTextWH<_Tag extends AnyTag>(
  json: Readonly<TextWHSchema>
): TextWH {
  return {
    layout: {chars: [], cursor: {x: 0, y: 0}, w: 0, h: 0, trimmedH: 0},
    maxW: json.maxW ?? drawableMaxWH.w,
    pad: parseBorder(json.pad),
    scale: json.scale ?? 1,
    trim: json.trim
  }
}

export function parseTextXY<Tag extends AnyTag>(
  ent: Ent<Tag>,
  json: Readonly<TextXYSchema>
): TextXY<Tag> {
  return {
    chars: [],
    z: json.z ? Layer[json.z] : (ent.sprite?.z ?? Layer.Bottom)
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
