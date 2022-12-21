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
  LayerSuborder,
  LayerSuborderFlagEnd,
  LayerSuborderFlagStart,
} from '@/void';
import { LayerMask } from './Layer.ts';

export type Sprite = {
  animator: Animator;
  bounds: I16Box;
  // animator collision detection is not wrap aware
  // 4b signed x wrap, 4b signed y wrap, 1b layer by start, 7b layer
  wrapSuborderLayer: U16;
};

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
  readonly layerSuborder?: LayerSuborder;
  readonly wrapX?: I4;
  readonly wrapY?: I4;
}

interface LayerConfig {
  readonly wrap: I4XY;
  readonly suborder: LayerSuborder;
  readonly layer: U8;
}

export function Sprite(film: Film, layer: U8, props?: SpriteProps): Sprite {
  const start = props?.start ?? I16XY(0, 0);
  const wh = props?.wh ?? I16XY(film.wh);
  const layerSuborder = props?.layerSuborder ?? 'End';
  const wrapX = props?.wrapX ?? I4(0);
  const wrapY = props?.wrapY ?? I4(0);
  return {
    animator: new Animator(film),
    bounds: I16Box(start.x, start.y, wh.x, wh.y),
    wrapSuborderLayer: serializeWrapSuborderLayer(
      I4XY(wrapX, wrapY),
      layerSuborder,
      layer,
    ),
  };
}

export namespace Sprite {
  export function intersectsBounds(
    self: Readonly<Sprite>,
    xy: Readonly<XY<number>>,
  ): boolean;
  export function intersectsBounds(
    self: Readonly<Sprite>,
    box: Readonly<NumberBox>,
  ): boolean;
  export function intersectsBounds(
    self: Readonly<Sprite>,
    sprite: Readonly<Sprite>,
  ): boolean;
  export function intersectsBounds(
    self: Readonly<Sprite>,
    xyOrBoxOrSprite: Readonly<XY<number> | NumberBox | Sprite>,
  ): boolean {
    if ('bounds' in xyOrBoxOrSprite) {
      return I16Box.intersects(self.bounds, xyOrBoxOrSprite.bounds);
    }
    return I16Box.intersects(self.bounds, <XY<number>> xyOrBoxOrSprite);
  }

  export function getCel(self: Readonly<Sprite>, time: number): Cel {
    return self.animator.cel(time);
  }

  export function intersectsSprite(
    self: Readonly<Sprite>,
    sprite: Readonly<Sprite>,
    time: number,
  ): boolean {
    if (!intersectsBounds(self, sprite)) return false;

    const cel = getCel(sprite, time);
    if (cel.slices.length == 0) {
      return intersects(self, sprite.bounds, time);
    }

    const box = I16Box.moveBy(I16Box(cel.sliceBounds), sprite.bounds.start);
    if (!intersects(self, box, time)) return false;
    for (const slice of cel.slices) {
      const box = I16Box.moveBy(I16Box(slice), sprite.bounds.start);
      if (intersects(self, box, time)) return true;
    }
    return false;
  }

  export function intersects(
    self: Readonly<Sprite>,
    box: Readonly<Box<XY<number>, number>>,
    time: number,
  ): boolean;
  export function intersects(
    self: Readonly<Sprite>,
    xy: Readonly<XY<number>>,
    time: number,
  ): boolean;
  export function intersects(
    self: Readonly<Sprite>,
    xyOrBox: Readonly<Box<XY<number>, number> | XY<number>>,
    time: number,
  ): boolean {
    if (!intersectsBounds(self, <XY<number>> xyOrBox)) return false;

    const cel = getCel(self, time);
    if (cel.slices.length == 0) return true; // No slices.

    const box = 'x' in xyOrBox
      ? I16Box.round(xyOrBox.x, xyOrBox.y, 0, 0)
      : I16Box.round(xyOrBox);
    I16Box.moveBy(box, -self.bounds.start.x, -self.bounds.start.y);
    if (!U16Box.intersects(cel.sliceBounds, box)) return false;
    for (const slice of cel.slices) {
      if (U16Box.intersects(slice, box)) return true;
    }
    return false;
  }

  export function getLayer(self: Sprite): U8 {
    return parseWrapSuborderLayer(self.wrapSuborderLayer).layer;
  }

  export function setLayer(self: Sprite, layer: U8): Sprite {
    const { wrap, suborder } = parseWrapSuborderLayer(self.wrapSuborderLayer);
    self.wrapSuborderLayer = serializeWrapSuborderLayer(wrap, suborder, layer);
    return self;
  }

  // to-do: flesh out the Sprite API
  export function moveTo(self: Sprite, xy: Readonly<I16XY>): Sprite {
    I16Box.moveTo(self.bounds, xy);
    return self;
  }

  export function reset(self: Sprite, start: number, film: Film): void {
    self.animator.reset(start, film);
  }

  // to-do: keep in sync with shader
  // order from top to bottom
  export function compareDepth(
    lhs: Readonly<Sprite>,
    rhs: Readonly<Sprite>,
  ): number {
    const { suborder: lhsSuborder, layer: lhsLayer } = parseWrapSuborderLayer(
      lhs.wrapSuborderLayer,
    );
    const { suborder: rhsSuborder, layer: rhsLayer } = parseWrapSuborderLayer(
      rhs.wrapSuborderLayer,
    );
    return lhsLayer == rhsLayer
      ? (rhs.bounds[Str.uncapitalize(rhsSuborder)].y -
        lhs.bounds[Str.uncapitalize(lhsSuborder)].y)
      : lhsLayer - rhsLayer;
  }

  export function parseWrapSuborderLayer(wrapSuborderLayer: U16): LayerConfig {
    const wrapX = I4.mod(NumUtil.ushift(wrapSuborderLayer, 12));
    const wrapY = I4.mod(NumUtil.ushift(wrapSuborderLayer, 8));
    const suborder = NumUtil.ushift(wrapSuborderLayer, 7) & 1;
    const layer = U8(wrapSuborderLayer & LayerMask);
    return {
      wrap: I4XY(wrapX, wrapY),
      suborder: suborder == LayerSuborderFlagEnd ? 'End' : 'Start',
      layer,
    };
  }
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
