import { Film } from '@/atlas-pack'
import {
  assert,
  assertNonNull,
  BoxJSON,
  I16,
  I16Box,
  NonNull,
  NumXY,
  U16XY,
  U8,
  Uint,
  XY,
} from '@/oidlib'
import {
  Cam,
  CursorFilmSet,
  FilmLUT,
  FollowCamConfig,
  FollowCamFill,
  Font,
  Layer,
  Sprite,
  SpriteFlip,
  SpriteProps,
  Text,
  VoidEnt,
} from '@/void'

export interface SpriteJSON {
  readonly flip?: string
  readonly id: string
  readonly layer: string
  readonly layerByHeight?: boolean
  readonly wh?: Partial<XY<number>>
  readonly wrap?: Partial<XY<number>>
  readonly xy?: Partial<XY<number>>
  readonly x?: number | undefined
  readonly y?: number | undefined
  readonly w?: number | undefined
  readonly h?: number | undefined
}

export interface FollowCamJSON {
  readonly fill?: string
  readonly modulo?: Partial<XY<number>>
  readonly orientation: string
  readonly pad?: Partial<XY<number>>
}

export interface CursorFilmSetJSON {
  readonly pick: string
  readonly point: string
}

export interface CamJSON {
  readonly xy?: Partial<XY<number>>
  readonly minViewport: Partial<XY<number>>
}

export interface VoidEntJSON {
  readonly cam?: CamJSON
  readonly cursor?: CursorFilmSetJSON
  readonly followCam?: FollowCamJSON
  readonly followPoint?: Record<never, never>
  readonly fps?: Record<never, never>
  readonly sprite?: SpriteJSON
  readonly sprites?: SpriteJSON[]
  readonly text?: TextJSON
}

export interface TextJSON extends BoxJSON {
  layer?: number
  str?: string
}

export namespace LevelParser {
  export function parseComponent(
    lut: FilmLUT,
    font: Font | undefined,
    key: string,
    val: unknown,
  ): VoidEnt[keyof VoidEntJSON] | undefined {
    switch (key) { // to-do: fail when missing types.
      case 'cam':
        return parseCam(val as CamJSON)
      case 'cursor':
        return parseCursorFilmSet(lut, val as CursorFilmSetJSON)
      case 'followCam':
        return parseFollowCam(val as FollowCamJSON)
      case 'followPoint':
        return {}
      case 'fps':
        return {
          prev: 0,
          next: { created: performance.now(), frames: Uint(0) },
        }
      case 'sprite':
        return parseSprite(lut, val as SpriteJSON)
      case 'sprites':
        return (val as SpriteJSON[]).map((v) => parseSprite(lut, v))
      case 'text':
        assertNonNull(font, 'Missing font for text component.')
        return parseText(font, val as TextJSON)
    }
  }

  export function parseText(font: Font, json: TextJSON): Text {
    return new Text(
      I16Box.fromJSON(json),
      font,
      U8(json.layer ?? Layer.Top),
      json.str ?? '',
    )
  }

  export function parseCam(json: CamJSON): Cam {
    return {
      // Avoid possible division by zero by specifying nonzero width and height.
      viewport: new I16Box(json.xy?.x ?? 0, json.xy?.y ?? 0, 1, 1),
      clientViewportWH: new NumXY(1, 1),
      nativeViewportWH: new U16XY(1, 1),
      minViewport: new U16XY(json.minViewport.x ?? 1, json.minViewport?.y ?? 1),
      scale: I16(1),
    }
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

  export function parseSprite(
    lut: FilmLUT,
    json: SpriteJSON,
  ): Sprite {
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
}

function parseFilm(lut: FilmLUT, id: string): Film {
  const film = lut.filmByID[id]
  return NonNull(film, `Bad film ID "${id}".`)
}

function parseFollowCamFill(fill: string): FollowCamFill {
  assert(
    FollowCamFill.values.has(fill as FollowCamFill),
    `Bad fill specifier "${fill}".`,
  )
  return fill as FollowCamFill
}

function parseFollowCamOrientation(
  orientation: string,
): FollowCamConfig.Orientation {
  assert(
    FollowCamConfig.Orientation.values.has(
      orientation as FollowCamConfig.Orientation,
    ),
    `Bad orientation "${orientation}".`,
  )
  return orientation as FollowCamConfig.Orientation
}

function parseLayer(lut: FilmLUT, layer: string): U8 {
  const code = lut.layerByID[layer]
  return NonNull(code, `Bad layer "${layer}".`)
}

function parseSpriteFlip(flip: string): SpriteFlip {
  assert(
    SpriteFlip.values.has(flip as SpriteFlip),
    `Bad flip specifier "${flip}".`,
  )
  return flip as SpriteFlip
}
