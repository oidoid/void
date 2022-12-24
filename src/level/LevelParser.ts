import { Film } from '@/atlas-pack';
import { assert, NonNull, NumberXY, U8 } from '@/oidlib';
import {
  ComponentSet,
  CursorFilmSet,
  FilmLUT,
  FollowCamConfig,
  FollowCamFill,
  Sprite,
  SpriteFlip,
  SpriteProps,
} from '@/void';

export interface SpriteJSON {
  readonly flip?: string;
  readonly id: string;
  readonly layer: string;
  readonly layerByHeight?: boolean;
  readonly wh?: Partial<NumberXY>;
  readonly wrap?: Partial<NumberXY>;
  readonly xy?: Partial<NumberXY>;
}

export interface FollowCamJSON {
  readonly fill?: string;
  readonly modulo?: Partial<NumberXY>;
  readonly orientation: string;
  readonly pad?: Partial<NumberXY>;
}

export interface CursorFilmSetJSON {
  readonly pick: string;
  readonly point: string;
}

export interface ComponentSetJSON {
  readonly cursor?: CursorFilmSetJSON;
  readonly followCam?: FollowCamJSON;
  readonly followPoint?: Record<never, never>;
  readonly sprite?: SpriteJSON;
}

export namespace LevelParser {
  export function parseComponent(
    lut: FilmLUT,
    key: string,
    val: unknown,
  ): ComponentSet[keyof ComponentSetJSON] | undefined {
    switch (key) { // to-do: fail when missing types.
      case 'cursor':
        return parseCursorFilmSet(lut, val as CursorFilmSetJSON);
      case 'followCam':
        return parseFollowCam(val as FollowCamJSON);
      case 'followPoint':
        return {};
      case 'sprite':
        return parseSprite(lut, val as SpriteJSON);
    }
  }

  export function parseFollowCam(json: FollowCamJSON): FollowCamConfig {
    return {
      fill: json.fill == null ? undefined : parseFollowCamFill(json.fill),
      orientation: parseFollowCamOrientation(json.orientation),
      modulo: json.modulo,
      pad: json.pad,
    };
  }

  export function parseCursorFilmSet(
    lut: FilmLUT,
    json: CursorFilmSetJSON,
  ): CursorFilmSet {
    return {
      pick: parseFilm(lut, json.pick),
      point: parseFilm(lut, json.point),
    };
  }

  export function parseSprite(
    lut: FilmLUT,
    json: SpriteJSON,
  ): Sprite {
    const film = parseFilm(lut, json.id);
    const layer = parseLayer(lut, json.layer);
    const props: SpriteProps = {
      flip: json.flip == null ? undefined : parseSpriteFlip(json.flip),
      wh: json.wh,
      wrap: json.wrap,
      xy: json.xy,
      layerByHeight: json.layerByHeight,
    };
    return new Sprite(film, layer, props);
  }
}

function parseFilm(lut: FilmLUT, id: string): Film {
  const film = lut.filmByID[id];
  return NonNull(film, `Bad film ID "${id}".`);
}

function parseFollowCamFill(fill: string): FollowCamFill {
  assert(
    FollowCamFill.values.has(fill as FollowCamFill),
    `Bad fill specifier "${fill}".`,
  );
  return fill as FollowCamFill;
}

function parseFollowCamOrientation(
  orientation: string,
): FollowCamConfig.Orientation {
  assert(
    FollowCamConfig.Orientation.values.has(
      orientation as FollowCamConfig.Orientation,
    ),
    `Bad orientation "${orientation}".`,
  );
  return orientation as FollowCamConfig.Orientation;
}

function parseLayer(lut: FilmLUT, layer: string): U8 {
  const code = lut.layerByID[layer];
  return NonNull(code, `Bad layer "${layer}".`);
}

function parseSpriteFlip(flip: string): SpriteFlip {
  assert(
    SpriteFlip.values.has(flip as SpriteFlip),
    `Bad flip specifier "${flip}".`,
  );
  return flip as SpriteFlip;
}
