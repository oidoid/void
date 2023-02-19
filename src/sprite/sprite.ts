import { Animator, Cel, Film } from '@/atlas-pack'
import {
  Box,
  I16,
  I16Box,
  I16XY,
  I4,
  I4XY,
  Immutable,
  NumUtil,
  U16,
  U8,
  XY,
} from '@/oidlib'
import { LayerByHeightFlag, LayerMask } from '@/void'

export interface SpriteProps {
  /**
   * The origin of the sprite in level coordinates. Defaults to (0, 0).
   *
   * Ents that are repositioned by other systems like FollowCam don't care.
   */
  readonly xy?: Partial<XY<number>> | undefined
  x?: number | undefined
  y?: number | undefined

  /** The dimensions of the sprite. Defaults to animation size. */
  readonly wh?: Partial<XY<number>> | undefined
  w?: number | undefined
  h?: number | undefined

  /**
   * How to resolve render order for sprites on same layer. When false (the
   * default), this sprite compares with `y`. When true, this sprite compares
   * with `y + h`.
   */
  readonly layerByHeight?: boolean | undefined
  /** Offset sprite. Capped to I4. */
  readonly wrap?: Partial<XY<number>> | undefined
  /** Mirror sprite. Defaults to unflipped. to-do: add intersection support. */
  readonly flip?: SpriteFlip | undefined
}

export type SpriteFlip = Parameters<typeof SpriteFlip.values['has']>[0]
export namespace SpriteFlip {
  export const values = Immutable(
    new Set(
      [
        /** Flip horizontally. */
        'X',
        /** Flip vertically. */
        'Y',
        /** Flip horizontally and vertically. */
        'XY',
      ] as const,
    ),
  )
}

interface WrapLayerByHeightLayer {
  readonly wrap: I4XY
  readonly layerByHeight: boolean
  readonly layer: U8
}

// to-do: i almost want this to extend Box. so many functions i want to expose wihtout have to drill into bounds
/** A renderable animation. */
export class Sprite {
  #animator: Animator
  #bounds: I16Box
  // animator collision detection is not wrap aware
  // 4b signed x wrap, 4b signed y wrap, 1b layer by start, 7b layer
  #wrapLayerByHeightLayer: U16

  get bounds(): I16Box {
    return this.#bounds
  }

  get film(): Film {
    return this.#animator.film
  }

  /** Height (negative when flipped). */
  get h(): I16 {
    return this.#bounds.h
  }

  get layer(): U8 {
    return parseWrapLayerByHeightLayer(this.#wrapLayerByHeightLayer).layer
  }

  set layer(layer: U8) {
    const { wrap, layerByHeight } = parseWrapLayerByHeightLayer(
      this.#wrapLayerByHeightLayer,
    )
    this.#wrapLayerByHeightLayer = serializeWrapLayerByHeightLayer(
      wrap,
      layerByHeight,
      layer,
    )
  }

  /** Width (negative when flipped). */
  get w(): I16 {
    return this.#bounds.w
  }

  get wrapLayerByHeightLayer(): U16 {
    return this.#wrapLayerByHeightLayer
  }

  get x(): I16 {
    return this.#bounds.x
  }

  get y(): I16 {
    return this.#bounds.y
  }

  constructor(film: Film, layer: U8, props?: SpriteProps) {
    this.#animator = new Animator(film)
    const flip = new I16XY(
      (props?.flip == 'X' || props?.flip == 'XY') ? -1 : 1,
      (props?.flip == 'Y' || props?.flip == 'XY') ? -1 : 1,
    )
    this.#bounds = new I16Box(
      props?.xy?.x ?? props?.x ?? 0,
      props?.xy?.y ?? props?.y ?? 0,
      (props?.wh?.x ?? props?.w ?? film.wh.x) * flip.x,
      (props?.wh?.y ?? props?.h ?? film.wh.y) * flip.y,
    )
    this.#wrapLayerByHeightLayer = serializeWrapLayerByHeightLayer(
      new I4XY(props?.wrap?.x ?? 0, props?.wrap?.y ?? 0),
      props?.layerByHeight ?? false,
      layer,
    )
  }

  /**
   * Clear the start time (set the animation to the starting cel) and optionally
   * change the film. This is useful to reset the active film or switch films.
   */
  animate(start: number, film?: Film): void {
    this.#animator.reset(start, film)
  }

  /** @return The active film cel. */
  cel(time: number): Cel {
    return this.#animator.cel(time)
  }

  // to-do: keep in sync with shader
  // order from top to bottom
  compareDepth(sprite: Sprite): number {
    const { layerByHeight: lhsLayerByHeight, layer: lhsLayer } =
      parseWrapLayerByHeightLayer(
        this.#wrapLayerByHeightLayer,
      )
    const { layerByHeight: rhsLayerByHeight, layer: rhsLayer } =
      parseWrapLayerByHeightLayer(
        sprite.#wrapLayerByHeightLayer,
      )
    return lhsLayer == rhsLayer
      ? (sprite.bounds[rhsLayerByHeight ? 'xy' : 'endNum'].y -
        this.bounds[lhsLayerByHeight ? 'xy' : 'endNum'].y)
      : lhsLayer - rhsLayer
  }

  /** True if this is in front of sprite. */
  isInFrontOf(sprite: Sprite): boolean {
    return this.compareDepth(sprite) < 0
  }

  intersects(box: Readonly<Box<number>>, time: number): boolean
  intersects(xy: Readonly<XY<number>>, time: number): boolean
  intersects(
    xyOrBox: Readonly<Box<number> | XY<number>>,
    time: number,
  ): boolean {
    if (!this.intersectsBounds(<XY<number>> xyOrBox)) return false

    const cel = this.cel(time)
    if (cel.slices.length == 0) return true // No slices.

    const box = 'w' in xyOrBox
      ? I16Box.round(xyOrBox)
      : I16Box.round(xyOrBox.x, xyOrBox.y, 0, 0)
    box.moveBy(-this.x, -this.y)
    if (!cel.sliceBounds.intersects(box)) return false
    for (const slice of cel.slices) {
      if (slice.intersects(box)) return true
    }
    return false
  }

  intersectsBounds(xy: Readonly<XY<number>>): boolean
  intersectsBounds(box: Readonly<Box<number>>): boolean
  intersectsBounds(sprite: Readonly<Sprite>): boolean
  intersectsBounds(
    xyOrBoxOrSprite: Readonly<XY<number> | Box<number> | Sprite>,
  ): boolean {
    if ('bounds' in xyOrBoxOrSprite) {
      return this.bounds.intersects(xyOrBoxOrSprite.bounds)
    }
    return this.bounds.intersects(xyOrBoxOrSprite)
  }

  intersectsSprite(sprite: Readonly<Sprite>, time: number): boolean {
    if (!this.intersectsBounds(sprite)) return false

    const cel = sprite.cel(time)
    if (cel.slices.length == 0) {
      return this.intersects(sprite.bounds, time)
    }

    const box = new I16Box(cel.sliceBounds).moveBy(sprite.bounds.xy)
    if (!this.intersects(box, time)) return false
    for (const slice of cel.slices) {
      const box = new I16Box(slice).moveBy(sprite.bounds.xy)
      if (this.intersects(box, time)) return true
    }
    return false
  }

  // to-do: flesh out the Sprite API
  moveTo(xy: Readonly<I16XY>): Sprite {
    this.bounds.moveTo(xy)
    return this
  }

  // This would be great as a prop setter of xy.
  moveBy(xy: Readonly<I16XY>): Sprite {
    this.bounds.moveBy(xy)
    return this
  }

  toString(): string {
    const wlbhl = parseWrapLayerByHeightLayer(this.#wrapLayerByHeightLayer)
    return `Sprite {id=${this.film.id} box=${this.bounds.toString()} ` +
      `layer=${wlbhl.layer} layerByHeight=${wlbhl.layerByHeight} ` +
      `wrap=${wlbhl.wrap.toString()}}`
  }
}

function parseWrapLayerByHeightLayer(
  wrapLayerByHeightLayer: U16,
): WrapLayerByHeightLayer {
  const wrapX = I4.mod(NumUtil.ushift(wrapLayerByHeightLayer, 12) & 0xf)
  const wrapY = I4.mod(NumUtil.ushift(wrapLayerByHeightLayer, 8) & 0xf)
  const layerByHeight = NumUtil.ushift(wrapLayerByHeightLayer, 7) & 1
  const layer = U8(wrapLayerByHeightLayer & LayerMask)
  return {
    wrap: new I4XY(wrapX, wrapY),
    layerByHeight: layerByHeight == LayerByHeightFlag,
    layer,
  }
}

function serializeWrapLayerByHeightLayer(
  wrapXY: I4XY,
  layerByHeight: boolean,
  layer: U8,
): U16 {
  // this is dangerous
  const wrap = NumUtil.lshift(wrapXY.x & 0xf, 12) |
    NumUtil.lshift(wrapXY.y & 0xf, 8)
  return U16(wrap | (layerByHeight ? 0 : LayerByHeightFlag) | layer)
}
