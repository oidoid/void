import { Animator, Cel, Film } from '@/atlas-pack';
import {
  Box,
  I16Box,
  I16XY,
  I4,
  I4XY,
  NumberBox,
  NumUtil,
  Str,
  U16,
  U16Box,
  U8,
  XY,
} from '@/oidlib';
import {
  LayerMask,
  LayerOrigin,
  LayerOriginFlagEnd,
  LayerOriginFlagStart,
} from '@/void';

// to-do: review fancy SpriteProps-like default generator in NE.
export interface SpriteProps {
  /**
   * The origin of the sprite in level coordinates. Defaults to (0, 0).
   *
   * Ents that are repositioned by other systems like FollowCam don't care.
   */
  readonly start?: Partial<I16XY>;
  /** The dimensions of the sprite. Defaults to animation size. */
  readonly wh?: Partial<I16XY>;
  /** How to resolve render order for sprites on same layer. */
  readonly layerOrigin?: LayerOrigin;
  /** Offset sprite. */
  readonly wrap?: Partial<I4XY>;
  /** Mirror sprite. to-do: add intersection support. */
  readonly flip?: SpriteFlip;
}

export type SpriteFlip =
  | /** Do not flip. */ ''
  | /** Flip horizontally. */ 'X'
  | /** Flip vertically. */ 'Y'
  | /** Flip horizontally and vertically. */ 'XY';

interface WrapOriginLayer {
  readonly wrap: I4XY;
  readonly origin: LayerOrigin;
  readonly layer: U8;
}

interface Flip {
  readonly flip: SpriteFlip;
}

/** A renderable animation. */
export class Sprite {
  #animator: Animator;
  #bounds: I16Box;
  // animator collision detection is not wrap aware
  // 4b signed x wrap, 4b signed y wrap, 1b layer by start, 7b layer
  #wrapOriginLayer: U16;
  // 2b flip, 00 - no flip, 01 : flip Y, 10 flip x, 11 flip x&y
  #flip: U16;

  get bounds(): I16Box {
    return this.#bounds;
  }

  get film(): Film {
    return this.#animator.film;
  }

  set layer(layer: U8) {
    const { wrap, origin } = parseWrapOriginLayer(this.#wrapOriginLayer);
    this.#wrapOriginLayer = serializeWrapOriginLayer(
      wrap,
      origin,
      layer,
    );
  }

  get flip(): U16 {
    return this.#flip;
  }

  get wrapOriginLayer(): U16 {
    return this.#wrapOriginLayer;
  }

  constructor(film: Film, layer: U8, props?: SpriteProps) {
    this.#animator = new Animator(film);
    this.#bounds = I16Box(
      props?.start?.x ?? 0,
      props?.start?.y ?? 0,
      props?.wh?.x ?? film.wh.x,
      props?.wh?.y ?? film.wh.y,
    );
    this.#wrapOriginLayer = serializeWrapOriginLayer(
      I4XY(props?.wrap?.x ?? 0, props?.wrap?.y ?? 0),
      props?.layerOrigin ?? 'End',
      layer,
    );
    this.#flip = serializeFlip(props?.flip ?? '');
  }

  /**
   * Clear the start time (set the animation to the starting cel) and optionally
   * change the film. This is useful to reset the active film or switch films.
   */
  animate(start: number, film?: Film): void {
    this.#animator.reset(start, film);
  }

  /** @return The active film cel. */
  cel(time: number): Cel {
    return this.#animator.cel(time);
  }

  // to-do: keep in sync with shader
  // order from top to bottom
  compareDepth(sprite: Sprite): number {
    const { origin: lhsOrigin, layer: lhsLayer } = parseWrapOriginLayer(
      this.#wrapOriginLayer,
    );
    const { origin: rhsOrigin, layer: rhsLayer } = parseWrapOriginLayer(
      sprite.#wrapOriginLayer,
    );
    return lhsLayer == rhsLayer
      ? (sprite.bounds[Str.uncapitalize(rhsOrigin)].y -
        this.bounds[Str.uncapitalize(lhsOrigin)].y)
      : lhsLayer - rhsLayer;
  }

  intersects(box: Readonly<Box<XY<number>, number>>, time: number): boolean;
  intersects(xy: Readonly<XY<number>>, time: number): boolean;
  intersects(
    xyOrBox: Readonly<Box<XY<number>, number> | XY<number>>,
    time: number,
  ): boolean {
    if (!this.intersectsBounds(<XY<number>> xyOrBox)) return false;

    const cel = this.cel(time);
    if (cel.slices.length == 0) return true; // No slices.

    const box = 'x' in xyOrBox
      ? I16Box.round(xyOrBox.x, xyOrBox.y, 0, 0)
      : I16Box.round(xyOrBox);
    I16Box.moveBy(box, -this.bounds.start.x, -this.bounds.start.y);
    if (!U16Box.intersects(cel.sliceBounds, box)) return false;
    for (const slice of cel.slices) {
      if (U16Box.intersects(slice, box)) return true;
    }
    return false;
  }

  intersectsBounds(xy: Readonly<XY<number>>): boolean;
  intersectsBounds(box: Readonly<NumberBox>): boolean;
  intersectsBounds(sprite: Readonly<Sprite>): boolean;
  intersectsBounds(
    xyOrBoxOrSprite: Readonly<XY<number> | NumberBox | Sprite>,
  ): boolean {
    if ('bounds' in xyOrBoxOrSprite) {
      return I16Box.intersects(this.bounds, xyOrBoxOrSprite.bounds);
    }
    return I16Box.intersects(this.bounds, <XY<number>> xyOrBoxOrSprite);
  }

  intersectsSprite(sprite: Readonly<Sprite>, time: number): boolean {
    if (!this.intersectsBounds(sprite)) return false;

    const cel = sprite.cel(time);
    if (cel.slices.length == 0) {
      return this.intersects(sprite.bounds, time);
    }

    const box = I16Box.moveBy(I16Box(cel.sliceBounds), sprite.bounds.start);
    if (!this.intersects(box, time)) return false;
    for (const slice of cel.slices) {
      const box = I16Box.moveBy(I16Box(slice), sprite.bounds.start);
      if (this.intersects(box, time)) return true;
    }
    return false;
  }

  // to-do: flesh out the Sprite API
  moveTo(xy: Readonly<I16XY>): Sprite {
    I16Box.moveTo(this.bounds, xy);
    return this;
  }

  toString(): string {
    const wol = parseWrapOriginLayer(this.#wrapOriginLayer);
    const flip = parseFlip(this.#flip);
    return `Sprite {id=${this.film.id} box=${
      I16Box.toString(this.bounds)
    } layer=${wol.layer} origin=${wol.origin} flip=${
      flip.flip || 'None'
    } wrap=${I4XY.toString(wol.wrap)}}`;
  }
}

function parseWrapOriginLayer(wrapOriginLayer: U16): WrapOriginLayer {
  const wrapX = I4.mod(NumUtil.ushift(wrapOriginLayer, 12) & 0xf);
  const wrapY = I4.mod(NumUtil.ushift(wrapOriginLayer, 8) & 0xf);
  const origin = NumUtil.ushift(wrapOriginLayer, 7) & 1;
  const layer = U8(wrapOriginLayer & LayerMask);
  return {
    wrap: I4XY(wrapX, wrapY),
    origin: origin == LayerOriginFlagEnd ? 'End' : 'Start',
    layer,
  };
}

function parseFlip(moreBits: U16): Flip {
  const flipX = (NumUtil.ushift(moreBits, 1) & 1) == 1;
  const flipY = (NumUtil.ushift(moreBits, 0) & 1) == 1;
  return { flip: `${flipX ? 'X' : ''}${flipY ? 'Y' : ''}` };
}

function serializeWrapOriginLayer(
  wrapXY: I4XY,
  layerOrigin: string,
  layer: U8,
): U16 {
  const origin = layerOrigin == 'End'
    ? LayerOriginFlagEnd
    : LayerOriginFlagStart;
  // this is dangerous
  const wrap = NumUtil.lshift(wrapXY.x & 0xf, 12) |
    NumUtil.lshift(wrapXY.y & 0xf, 8);
  return U16(wrap | origin | layer);
}

function serializeFlip(flip: SpriteFlip): U16 {
  const flipX = flip == 'X' || flip == 'XY';
  const flipY = flip == 'Y' || flip == 'XY';
  const flipXY = (((flipX ? 1 : 0) << 1) | ((flipY ? 1 : 0) << 0)) << 0;
  return U16(flipXY | 0);
}
