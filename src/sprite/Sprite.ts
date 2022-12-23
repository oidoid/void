import { Animator, Cel, Film } from '@/atlas-pack';
import {
  Box,
  I16,
  I16Box,
  I16XY,
  I4,
  I4XY,
  NumberBox,
  NumUtil,
  U16,
  U16Box,
  U8,
  XY,
} from '@/oidlib';
import { LayerMask } from '@/void';
import { IncludeHeightFlag } from './Layer.ts';

export interface SpriteProps {
  /**
   * The origin of the sprite in level coordinates. Defaults to (0, 0).
   *
   * Ents that are repositioned by other systems like FollowCam don't care.
   */
  readonly start?: Partial<I16XY>;
  /** The dimensions of the sprite. Defaults to animation size. */
  readonly wh?: Partial<I16XY>;
  /**
   * How to resolve render order for sprites on same layer. When false (the
   * default), this sprite compares with `y`. When true, this sprite compares
   * with `y + h`.
   */
  readonly includeHeight?: boolean;
  /** Offset sprite. */
  readonly wrap?: Partial<I4XY>;
  /** Mirror sprite. Defaults to unflipped. to-do: add intersection support. */
  readonly flip?: SpriteFlip;
}

export type SpriteFlip =
  | /** Do not flip. */ ''
  | /** Flip horizontally. */ 'X'
  | /** Flip vertically. */ 'Y'
  | /** Flip horizontally and vertically. */ 'XY';

interface WrapIncludeHeightLayer {
  readonly wrap: I4XY;
  readonly includeHeight: boolean;
  readonly layer: U8;
}

/** A renderable animation. */
export class Sprite {
  #animator: Animator;
  #bounds: I16Box;
  // animator collision detection is not wrap aware
  // 4b signed x wrap, 4b signed y wrap, 1b layer by start, 7b layer
  #wrapIncludeHeightLayer: U16;

  get bounds(): I16Box {
    return this.#bounds;
  }

  get film(): Film {
    return this.#animator.film;
  }

  /** Height (negative when flipped). */
  get h(): I16 {
    return I16Box.height(this.#bounds);
  }

  set layer(layer: U8) {
    const { wrap, includeHeight } = parseWrapIncludeHeightLayer(
      this.#wrapIncludeHeightLayer,
    );
    this.#wrapIncludeHeightLayer = serializeWrapIncludeHeightLayer(
      wrap,
      includeHeight,
      layer,
    );
  }

  /** Width (negative when flipped). */
  get w(): I16 {
    return I16Box.width(this.#bounds);
  }

  get wrapIncludeHeightLayer(): U16 {
    return this.#wrapIncludeHeightLayer;
  }

  get x(): I16 {
    return this.#bounds.start.x;
  }

  get y(): I16 {
    return this.#bounds.start.y;
  }

  constructor(film: Film, layer: U8, props?: SpriteProps) {
    this.#animator = new Animator(film);
    const flip = I16XY(
      (props?.flip == 'X' || props?.flip == 'XY') ? -1 : 1,
      (props?.flip == 'Y' || props?.flip == 'XY') ? -1 : 1,
    );
    this.#bounds = I16Box(
      props?.start?.x ?? 0,
      props?.start?.y ?? 0,
      (props?.wh?.x ?? film.wh.x) * flip.x,
      (props?.wh?.y ?? film.wh.y) * flip.y,
    );
    this.#wrapIncludeHeightLayer = serializeWrapIncludeHeightLayer(
      I4XY(props?.wrap?.x ?? 0, props?.wrap?.y ?? 0),
      props?.includeHeight ?? false,
      layer,
    );
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
    const { includeHeight: lhsIncludeHeight, layer: lhsLayer } =
      parseWrapIncludeHeightLayer(
        this.#wrapIncludeHeightLayer,
      );
    const { includeHeight: rhsIncludeHeight, layer: rhsLayer } =
      parseWrapIncludeHeightLayer(
        sprite.#wrapIncludeHeightLayer,
      );
    return lhsLayer == rhsLayer
      ? (sprite.bounds[rhsIncludeHeight ? 'start' : 'end'].y -
        this.bounds[lhsIncludeHeight ? 'start' : 'end'].y)
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
    I16Box.moveBy(box, -this.x, -this.y);
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
    const wihl = parseWrapIncludeHeightLayer(this.#wrapIncludeHeightLayer);
    return `Sprite {id=${this.film.id} box=${
      I16Box.toString(this.bounds)
    } layer=${wihl.layer} includeHeight=${wihl.includeHeight} wrap=${
      I4XY.toString(wihl.wrap)
    }}`;
  }
}

function parseWrapIncludeHeightLayer(
  wrapIncludeHeightLayer: U16,
): WrapIncludeHeightLayer {
  const wrapX = I4.mod(NumUtil.ushift(wrapIncludeHeightLayer, 12) & 0xf);
  const wrapY = I4.mod(NumUtil.ushift(wrapIncludeHeightLayer, 8) & 0xf);
  const includeHeight = NumUtil.ushift(wrapIncludeHeightLayer, 7) & 1;
  const layer = U8(wrapIncludeHeightLayer & LayerMask);
  return {
    wrap: I4XY(wrapX, wrapY),
    includeHeight: includeHeight == IncludeHeightFlag,
    layer,
  };
}

function serializeWrapIncludeHeightLayer(
  wrapXY: I4XY,
  includeHeight: boolean,
  layer: U8,
): U16 {
  // this is dangerous
  const wrap = NumUtil.lshift(wrapXY.x & 0xf, 12) |
    NumUtil.lshift(wrapXY.y & 0xf, 8);
  return U16(wrap | (includeHeight ? 0 : IncludeHeightFlag) | layer);
}
