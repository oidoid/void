import { Film } from '@/atlas-pack'
import { assert, assertNonNull, NonNull, PartialXY } from '@/ooz'
import {
  CursorFilmSet,
  FilmLUT,
  FollowCamConfig,
  FollowCamFill,
  FollowCamFillSet,
  FollowCamOrientation,
  FollowCamOrientationSet,
  Font,
  Layer,
  Sprite,
  SpriteFlip,
  SpriteFlipSet,
  SpriteProps,
  Text,
  VoidEnt,
} from '@/void'

export interface SpriteJSON {
  readonly flip?: string
  readonly id: string
  readonly layer: string
  readonly layerByHeight?: boolean
  readonly wh?: PartialXY
  readonly wrap?: PartialXY
  readonly xy?: PartialXY
  readonly x?: number | undefined
  readonly y?: number | undefined
  readonly w?: number | undefined
  readonly h?: number | undefined
}

export interface FollowCamJSON {
  readonly fill?: string
  readonly modulo?: PartialXY
  readonly orientation: string
  readonly pad?: PartialXY
}

export interface CursorFilmSetJSON {
  readonly pick: string
  readonly point: string
}

export interface VoidEntJSON {
  readonly cursor?: CursorFilmSetJSON
  readonly followCam?: FollowCamJSON
  readonly followPoint?: Record<never, never>
  readonly fps?: Record<never, never>
  readonly sprites?: SpriteJSON[]
  readonly text?: TextJSON
}

export interface TextJSON {
  readonly layer?: number
  readonly str?: string
  readonly w?: number
}

export function parseComponent(
  lut: FilmLUT,
  font: Font | undefined,
  key: string,
  val: unknown,
): VoidEnt[keyof VoidEntJSON] | undefined {
  switch (key) { // to-do: fail when missing types.
    case 'cursor':
      return parseCursorFilmSet(lut, val as CursorFilmSetJSON)
    case 'followCam':
      return parseFollowCam(val as FollowCamJSON)
    case 'followPoint':
      return {}
    case 'fps':
      return {
        prev: 0,
        next: { created: performance.now(), frames: 0 },
      }
    case 'sprites':
      return (val as SpriteJSON[]).map((v) => parseSprite(lut, v))
    case 'text':
      assertNonNull(font, 'Missing font for text component.')
      return parseText(font, val as TextJSON)
  }
}

export function parseText(font: Font, json: TextJSON): Text {
  return new Text(
    font,
    json.layer ?? Layer.Top,
    json.str ?? '',
    json.w ?? 0,
  )
}

export function parseFollowCam(json: FollowCamJSON): FollowCamConfig {
  return {
    fill: json.fill == null ? undefined : parseFollowCamFill(json.fill),
    orientation: parseFollowCamOrientation(json.orientation),
    modulo: json.modulo,
    pad: json.pad,
  }
}

export function parseCursorFilmSet(
  lut: FilmLUT,
  json: CursorFilmSetJSON,
): CursorFilmSet {
  return {
    pick: parseFilm(lut, json.pick),
    point: parseFilm(lut, json.point),
  }
}

export function parseSprite(lut: FilmLUT, json: SpriteJSON): Sprite {
  const film = parseFilm(lut, json.id)
  const layer = parseLayer(lut, json.layer)
  const props: SpriteProps = {
    flip: json.flip == null ? undefined : parseSpriteFlip(json.flip),
    wh: json.wh,
    wrap: json.wrap,
    xy: json.xy,
    x: json.x,
    y: json.y,
    w: json.w,
    h: json.h,
    layerByHeight: json.layerByHeight,
  }
  return new Sprite(film, layer, props)
}

function parseFilm(lut: FilmLUT, id: string): Film {
  const film = lut.filmByID[id]
  return NonNull(film, `Bad film ID "${id}".`)
}

function parseFollowCamFill(fill: string): FollowCamFill {
  assert(
    FollowCamFillSet.has(fill as FollowCamFill),
    `Bad fill specifier "${fill}".`,
  )
  return fill as FollowCamFill
}

function parseFollowCamOrientation(
  orientation: string,
): FollowCamOrientation {
  assert(
    FollowCamOrientationSet.has(orientation as FollowCamOrientation),
    `Bad orientation "${orientation}".`,
  )
  return orientation as FollowCamOrientation
}

function parseLayer(lut: FilmLUT, layer: string): number {
  const code = lut.layerByID[layer]
  return NonNull(code, `Bad layer "${layer}".`)
}

function parseSpriteFlip(flip: string): SpriteFlip {
  assert(SpriteFlipSet.has(flip as SpriteFlip), `Bad flip specifier "${flip}".`)
  return flip as SpriteFlip
}
