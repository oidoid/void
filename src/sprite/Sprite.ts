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
  LayerSuborder,
  LayerSuborderFlagEnd,
  LayerSuborderFlagStart,
} from '@/void';

// to-do: review fancy SpriteProps-like default generator in NE.
export interface SpriteProps {
  /**
   * The origin of the sprite in level coordinates. Defaults to (0, 0).
   *
   * Ents that are repositioned by other systems like FollowCam don't care.
   */
  readonly start?: I16XY;
  /** The dimensions of the sprite. Defaults to animation size. */
  readonly wh?: I16XY;
  /** How to resolve render order for sprites on same layer. */
  readonly layerSuborder?: LayerSuborder;
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

interface WrapSuborderLayer {
  readonly wrap: I4XY;
  readonly suborder: LayerSuborder;
  readonly layer: U8;
}

interface Flip {
  readonly flip: SpriteFlip;
}

export class Sprite {
  #animator: Animator;
  #bounds: I16Box;
  // animator collision detection is not wrap aware
  // 4b signed x wrap, 4b signed y wrap, 1b layer by start, 7b layer
  #wrapSuborderLayer: U16;
  // 2b flip, 00 - no flip, 01 : flip Y, 10 flip x, 11 flip x&y
  #flip: U16;

  get bounds(): I16Box {
    return this.#bounds;
  }

  get film(): Film {
    return this.#animator.film;
  }

  set layer(layer: U8) {
    const { wrap, suborder } = parseWrapSuborderLayer(this.#wrapSuborderLayer);
    this.#wrapSuborderLayer = serializeWrapSuborderLayer(
      wrap,
      suborder,
      layer,
    );
  }

  get flip(): U16 {
    return this.#flip;
  }

  get wrapSuborderLayer(): U16 {
    return this.#wrapSuborderLayer;
  }

  constructor(film: Film, layer: U8, props?: SpriteProps) {
    const start = props?.start ?? I16XY(0, 0);
    const wh = props?.wh ?? I16XY(film.wh);
    const layerSuborder = props?.layerSuborder ?? 'End';
    const wrapX = props?.wrap?.x ?? I4(0);
    const wrapY = props?.wrap?.y ?? I4(0);
    this.#animator = new Animator(film);
    this.#bounds = I16Box(start.x, start.y, wh.x, wh.y);
    this.#wrapSuborderLayer = serializeWrapSuborderLayer(
      I4XY(wrapX, wrapY),
      layerSuborder,
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
    const { suborder: lhsSuborder, layer: lhsLayer } = parseWrapSuborderLayer(
      this.#wrapSuborderLayer,
    );
    const { suborder: rhsSuborder, layer: rhsLayer } = parseWrapSuborderLayer(
      sprite.#wrapSuborderLayer,
    );
    return lhsLayer == rhsLayer
      ? (sprite.bounds[Str.uncapitalize(rhsSuborder)].y -
        this.bounds[Str.uncapitalize(lhsSuborder)].y)
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
    const wsl = parseWrapSuborderLayer(this.#wrapSuborderLayer);
    const flip = parseFlip(this.#flip);
    return `Sprite {id=${this.film.id} box=${
      I16Box.toString(this.bounds)
    } layer=${wsl.layer} suborder=${wsl.suborder} flip=${
      flip.flip || 'None'
    } wrap=${I4XY.toString(wsl.wrap)}}`;
  }
}

function parseWrapSuborderLayer(wrapSuborderLayer: U16): WrapSuborderLayer {
  const wrapX = I4.mod(NumUtil.ushift(wrapSuborderLayer, 12) & 0xf);
  const wrapY = I4.mod(NumUtil.ushift(wrapSuborderLayer, 8) & 0xf);
  const suborder = NumUtil.ushift(wrapSuborderLayer, 7) & 1;
  const layer = U8(wrapSuborderLayer & LayerMask);
  return {
    wrap: I4XY(wrapX, wrapY),
    suborder: suborder == LayerSuborderFlagEnd ? 'End' : 'Start',
    layer,
  };
}

function parseFlip(moreBits: U16): Flip {
  const flipX = (NumUtil.ushift(moreBits, 1) & 1) == 1;
  const flipY = (NumUtil.ushift(moreBits, 0) & 1) == 1;
  return { flip: `${flipX ? 'X' : ''}${flipY ? 'Y' : ''}` };
}

function serializeWrapSuborderLayer(
  wrapXY: I4XY,
  layerSuborder: string,
  layer: U8,
): U16 {
  const suborder = layerSuborder == 'End'
    ? LayerSuborderFlagEnd
    : LayerSuborderFlagStart;
  // this is dangerous
  const wrap = NumUtil.lshift(wrapXY.x & 0xf, 12) |
    NumUtil.lshift(wrapXY.y & 0xf, 8);
  return U16(wrap | suborder | layer);
}

function serializeFlip(flip: SpriteFlip): U16 {
  const flipX = flip == 'X' || flip == 'XY';
  const flipY = flip == 'Y' || flip == 'XY';
  const flipXY = (((flipX ? 1 : 0) << 1) | ((flipY ? 1 : 0) << 0)) << 0;
  return U16(flipXY | 0);
}
