import { Animator, Cel, Film } from '@/atlas-pack'
import { Box, PartialXY, wrapNum, XY } from '@/ooz'
import {
  Bitmap,
  LayerByHeightFlag,
  LayerByHeightMask,
  LayerByHeightShift,
  LayerByOriginFlag,
  LayerMask,
  LayerShift,
  WrapXMask,
  WrapXShift,
  WrapXWidth,
  WrapYMask,
  WrapYShift,
  WrapYWidth,
} from '@/void'

export interface SpriteProps {
  /**
   * The origin of the sprite in level coordinates. Defaults to (0, 0).
   *
   * Ents that are repositioned by other systems like FollowCam don't care.
   */
  readonly xy?: PartialXY | undefined
  readonly x?: number | undefined
  readonly y?: number | undefined

  /** The dimensions of the sprite. Defaults to animation size. */
  readonly wh?: PartialXY | undefined
  readonly w?: number | undefined
  readonly h?: number | undefined

  /**
   * How to resolve render order for sprites on same layer. When false (the
   * default), this sprite compares with `y`. When true, this sprite compares
   * with `y + h`.
   */
  readonly layerByHeight?: boolean | undefined
  /** Offset sprite. Capped to I4. */
  readonly wrap?: PartialXY | undefined
  /** Mirror sprite. Defaults to unflipped. to-do: add intersection support. */
  readonly flip?: SpriteFlip | undefined

  /** The animation starting time. */
  readonly time?: number
}

export type SpriteFlip = Parameters<typeof SpriteFlipSet['has']>[0]
export const SpriteFlipSet = new Set(
  [
    /** Flip horizontally. */
    'X',
    /** Flip vertically. */
    'Y',
    /** Flip horizontally and vertically. */
    'XY',
  ] as const,
)

interface WrapLayerByHeightLayer {
  readonly wrap: XY
  readonly layerByHeight: boolean
  readonly layer: number
}

/**
 * A renderable animation.
 *
 * A good portion of this class wraps the render bounds. Few mutable methods for
 * the render bounds are offered as they can impact rendering and collision
 * detection in surprising ways. Reach into bounds directly (and carefully) as
 * needed.
 *
 * Collision detection can be against the render bounds or against the render
 * bounds AND animation state (Cel.slices). Collision detection is not aware of
 * texture offset (wrap).
 */
export class Sprite implements Bitmap {
  #animator: Animator
  #bounds: Box
  #wrapLayerByHeightLayer: number

  constructor(film: Film, layer: number, props?: SpriteProps) {
    this.#animator = new Animator(film, props?.time)
    const flip = new XY(
      (props?.flip === 'X' || props?.flip === 'XY') ? -1 : 1,
      (props?.flip === 'Y' || props?.flip === 'XY') ? -1 : 1,
    )
    this.#bounds = new Box(
      props?.xy?.x ?? props?.x ?? 0,
      props?.xy?.y ?? props?.y ?? 0,
      (props?.wh?.x ?? props?.w ?? film.wh.x) * flip.x,
      (props?.wh?.y ?? props?.h ?? film.wh.y) * flip.y,
    )
    this.#wrapLayerByHeightLayer = serializeWrapLayerByHeightLayer(
      new XY(props?.wrap?.x ?? 0, props?.wrap?.y ?? 0),
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

  /** Rendered width (w) × height (h) (may be negative if flipped). */
  get area(): number {
    return this.#bounds.area
  }

  /**
   * The rendered size. This bounds usually matches Cel.bounds but may be
   * smaller or larger. When differing, bounds may affect collision detection.
   */
  get bounds(): Box {
    return this.#bounds
  }

  /** The active film cel. */
  cel(time: number): Cel {
    return this.#animator.cel(time)
  }

  /** The center coordinate. */
  get center(): XY {
    return this.#bounds.center
  }

  // to-do: keep in sync with shader
  /**
   * Compare a sprite's elevation to another in descending order
   * (top-to-bottom).
   */
  compareDepth(sprite: this): number {
    const { layerByHeight: lhsLayerByHeight, layer: lhsLayer } =
      parseWrapLayerByHeightLayer(
        this.#wrapLayerByHeightLayer,
      )
    const { layerByHeight: rhsLayerByHeight, layer: rhsLayer } =
      parseWrapLayerByHeightLayer(
        sprite.#wrapLayerByHeightLayer,
      )
    return lhsLayer === rhsLayer
      ? (sprite.bounds[rhsLayerByHeight ? 'xy' : 'end'].y -
        this.#bounds[lhsLayerByHeight ? 'xy' : 'end'].y)
      : lhsLayer - rhsLayer
  }

  /** The starting coordinate plus dimensions. */
  get end(): XY {
    return this.#bounds.end
  }

  get film(): Film {
    return this.#animator.film
  }

  get flipX(): boolean {
    return this.#bounds.w < 0
  }

  set flipX(flip: boolean) {
    this.#bounds.w = Math.abs(this.#bounds.w) * (flip ? -1 : 1)
  }

  get flipY(): boolean {
    return this.#bounds.h < 0
  }

  set flipY(flip: boolean) {
    this.#bounds.h = Math.abs(this.#bounds.h) * (flip ? -1 : 1)
  }

  /** Height (negative when flipped). */
  get h(): number {
    return this.#bounds.h
  }

  set h(h: number) {
    this.#bounds.h = h
  }

  /** Intersect by slices if present, bounds if not. */
  intersects(xy: Readonly<XY>, time: number): boolean
  intersects(box: Readonly<Box>, time: number): boolean
  intersects(sprite: Readonly<Sprite>, time: number): boolean
  intersects(
    xyBoxSprite: Readonly<Box | Sprite | XY>,
    time: number,
  ): boolean {
    // 1: does this bounds intersect with args?
    if (!this.intersectsBounds(<XY> xyBoxSprite)) return false

    // 2: this bounds intersects; are slices specified?
    const cel = this.cel(time)
    if (cel.slices.length === 0) return true // No slices.

    // 3: slices are specified; do the superset and any one of them collide with
    // args?

    // 3.a: args is Box or XY.
    if (xyBoxSprite instanceof Box || xyBoxSprite instanceof XY) {
      const box = xyBoxSprite instanceof Box
        ? xyBoxSprite.copy()
        : new Box(xyBoxSprite.x, xyBoxSprite.y, 0, 0)
      box.xy.add(-this.x, -this.y)

      // 3.a.i superset.
      if (!cel.sliceBounds.intersects(box)) return false

      // 3.a.i any.
      return cel.slices.some((slice) => slice.intersects(box))
    }

    // 3.b: args is sprite; we already know this bounds collides with sprite
    // bounds.
    const sprite = <Sprite> xyBoxSprite

    // 3.b.i are sprite slices specified?
    const spriteCel = sprite.cel(time)
    if (spriteCel.slices.length === 0) return true // No slices.

    // 3.b.ii this superset intersect sprite superset?
    if (!cel.sliceBounds.intersects(spriteCel.sliceBounds)) return false

    // 3.b.iii any of these slices intersect any of sprite's slices?
    for (const slice of cel.slices) {
      for (const spriteSlice of spriteCel.slices) {
        if (slice.intersects(spriteSlice)) return true
      }
    }

    return false
  }

  /**
   * Return true if bounds and arguments are overlapping, false if only touching
   * or independent.
   */
  intersectsBounds(xy: Readonly<XY>): boolean
  intersectsBounds(box: Readonly<Box>): boolean
  intersectsBounds(sprite: Readonly<this>): boolean
  intersectsBounds(xyBoxSprite: Readonly<XY | Box | this>): boolean {
    if (xyBoxSprite instanceof Sprite) {
      return this.#bounds.intersects(xyBoxSprite.bounds)
    }
    return this.#bounds.intersects(xyBoxSprite as Readonly<Box>)
  }

  /** True if this is in front of sprite. */
  isAbove(sprite: Readonly<this>): boolean {
    return this.compareDepth(sprite) < 0
  }

  get layer(): number {
    return parseWrapLayerByHeightLayer(this.#wrapLayerByHeightLayer).layer
  }

  set layer(layer: number) {
    const { wrap, layerByHeight } = parseWrapLayerByHeightLayer(
      this.#wrapLayerByHeightLayer,
    )
    this.#wrapLayerByHeightLayer = serializeWrapLayerByHeightLayer(
      wrap,
      layerByHeight,
      layer,
    )
  }

  /** The greatest coordinate of this box. */
  get max(): XY {
    return this.#bounds.max
  }

  /** The least coordinate of this box. */
  get min(): XY {
    return this.#bounds.min
  }

  toString(): string {
    const wlbhl = parseWrapLayerByHeightLayer(this.#wrapLayerByHeightLayer)
    return `Sprite {id=${this.film.id} box=${this.#bounds} ` +
      `layer=${wlbhl.layer} layerByHeight=${wlbhl.layerByHeight} ` +
      `wrap=${wlbhl.wrap}}`
  }

  /** Width (negative when flipped). */
  get w(): number {
    return this.#bounds.w
  }

  set w(w: number) {
    this.#bounds.w = w
  }

  /** The box dimensions. */
  get wh(): XY {
    return this.#bounds.wh
  }

  get wrapLayerByHeightLayer(): number {
    return this.#wrapLayerByHeightLayer
  }

  /** The box coordinates. */
  get xy(): XY {
    return this.#bounds.xy
  }

  get x(): number {
    return this.#bounds.x
  }

  set x(x: number) {
    this.#bounds.x = x
  }

  get y(): number {
    return this.#bounds.y
  }

  set y(y: number) {
    this.#bounds.y = y
  }
}

/** @internal */
export function parseWrapLayerByHeightLayer(
  wrapLayerByHeightLayer: number,
): WrapLayerByHeightLayer {
  const wrapX = wrapNum(
    (wrapLayerByHeightLayer >> WrapXShift) & WrapXMask,
    -(2 ** (WrapXWidth - 1)),
    2 ** (WrapXWidth - 1),
  )
  const wrapY = wrapNum(
    (wrapLayerByHeightLayer >> WrapYShift) & WrapYMask,
    -(2 ** (WrapYWidth - 1)),
    2 ** (WrapYWidth - 1),
  )
  const layerByHeight = (wrapLayerByHeightLayer >> LayerByHeightShift) &
    LayerByHeightMask
  const layer = (wrapLayerByHeightLayer >> LayerShift) & LayerMask
  return {
    wrap: new XY(wrapX, wrapY),
    layerByHeight: layerByHeight === LayerByHeightFlag,
    layer,
  }
}

/** @internal */
export function serializeWrapLayerByHeightLayer(
  wrapXY: XY,
  layerByHeight: boolean,
  layer: number,
): number {
  const wrap = ((wrapXY.x & WrapXMask) << WrapXShift) |
    ((wrapXY.y & WrapYMask) << WrapYShift)
  const layerByHeightFlag = layerByHeight
    ? LayerByHeightFlag
    : LayerByOriginFlag
  return wrap | (layerByHeightFlag << LayerByHeightShift) |
    ((layer & LayerMask) << LayerShift)
}
