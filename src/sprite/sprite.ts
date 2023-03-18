import { Animator, Cel, Film } from '@/atlas-pack'
import {
  Box,
  I16,
  I16Box,
  I16XY,
  I4,
  I4XY,
  Immutable,
  NumXY,
  U16,
  U8,
  XY,
} from '@/ooz'
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
  WrapYMask,
  WrapYShift,
} from '@/void'

export interface SpriteProps {
  /**
   * The origin of the sprite in level coordinates. Defaults to (0, 0).
   *
   * Ents that are repositioned by other systems like FollowCam don't care.
   */
  readonly xy?: Partial<XY<number>> | undefined
  readonly x?: number | undefined
  readonly y?: number | undefined

  /** The dimensions of the sprite. Defaults to animation size. */
  readonly wh?: Partial<XY<number>> | undefined
  readonly w?: number | undefined
  readonly h?: number | undefined

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

  /** The animation starting time. */
  readonly time?: number
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
  #bounds: I16Box
  #wrapLayerByHeightLayer: U16

  constructor(film: Film, layer: U8, props?: SpriteProps) {
    this.#animator = new Animator(film, props?.time)
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

  /** Rendered width (w) × height (h) (may be negative if flipped). */
  get area(): I16 {
    return this.#bounds.area
  }

  get areaClamp(): I16 {
    return this.#bounds.areaClamp
  }

  get areaNum(): number {
    return this.#bounds.areaNum
  }

  /**
   * The rendered size. This bounds usually matches Cel.bounds but may be
   * smaller or larger. When differing, bounds may affect collision detection.
   */
  get bounds(): I16Box {
    return this.#bounds
  }

  /** The active film cel. */
  cel(time: number): Cel {
    return this.#animator.cel(time)
  }

  /** The center coordinate. */
  get center(): I16XY {
    return this.#bounds.center
  }

  get centerNum(): NumXY {
    return this.#bounds.centerNum
  }

  get centerCeil(): I16XY {
    return this.#bounds.centerCeil
  }

  get centerFloor(): I16XY {
    return this.#bounds.centerFloor
  }

  get centerRound(): I16XY {
    return this.#bounds.centerRound
  }

  get centerTrunc(): I16XY {
    return this.#bounds.centerTrunc
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
    return lhsLayer == rhsLayer
      ? (sprite.bounds[rhsLayerByHeight ? 'xy' : 'endNum'].y -
        this.bounds[lhsLayerByHeight ? 'xy' : 'endNum'].y)
      : lhsLayer - rhsLayer
  }

  /** The starting coordinate plus dimensions. */
  get end(): I16XY {
    return this.#bounds.end
  }

  get endClamp(): I16XY {
    return this.#bounds.endClamp
  }

  get endNum(): NumXY {
    return this.#bounds.endNum
  }

  get film(): Film {
    return this.#animator.film
  }

  /**
   * True if boxed is flipped along either or both axes. Doesn't impact
   * rendering.
   */
  get flipped(): boolean {
    return this.#bounds.flipped
  }

  /** Height (negative when flipped). */
  get h(): I16 {
    return this.#bounds.h
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
    for (const slice of cel.slices) if (slice.intersects(box)) return true
    return false
  }

  /**
   * Return true if self and box are overlapping, false if only touching or
   * independent.
   */
  intersectsBounds(x: number, y: number): boolean
  intersectsBounds(xy: Readonly<XY<number>>): boolean
  intersectsBounds(x: number, y: number, w: number, h: number): boolean
  intersectsBounds(xy: Readonly<XY<number>>, wh: Readonly<XY<number>>): boolean
  intersectsBounds(box: Readonly<Box<number>>): boolean
  intersectsBounds(sprite: Readonly<Sprite>): boolean
  intersectsBounds(
    xXYBoxSprite: number | Readonly<XY<number> | Box<number> | Sprite>,
    yWH?: number | Readonly<XY<number>>,
    w?: number,
    h?: number,
  ): boolean {
    if (typeof xXYBoxSprite == 'object' && 'bounds' in xXYBoxSprite) {
      return this.bounds.intersects(xXYBoxSprite.bounds)
    }
    return this.bounds.intersects(xXYBoxSprite as number, yWH as number, w!, h!)
  }

  intersectsSprite(sprite: Readonly<Sprite>, time: number): boolean {
    if (!this.intersectsBounds(sprite)) return false

    const cel = sprite.cel(time)
    if (cel.slices.length == 0) {
      return this.intersects(sprite.bounds, time)
    }

    const box = cel.sliceBounds.copy().moveBy(sprite.bounds.xy)
    if (!this.intersects(box, time)) return false
    for (const slice of cel.slices) {
      const box = slice.copy().moveBy(sprite.bounds.xy)
      if (this.intersects(box, time)) return true
    }
    return false
  }

  /** True if this is in front of sprite. */
  isAbove(sprite: Readonly<this>): boolean {
    return this.compareDepth(sprite) < 0
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

  /** The greatest coordinate of this box. */
  get max(): I16XY {
    return this.#bounds.max
  }

  get maxClamp(): I16XY {
    return this.#bounds.maxClamp
  }

  get maxNum(): NumXY {
    return this.#bounds.maxNum
  }

  /** The least coordinate of this box. */
  get min(): I16XY {
    return this.#bounds.min
  }

  get minClamp(): I16XY {
    return this.#bounds.minClamp
  }

  get minNum(): NumXY {
    return this.#bounds.minNum
  }

  /** Reposition the box by arguments. */
  moveBy(x: number, y: number): this
  moveBy(xy: Readonly<XY<number>>): this
  moveBy(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveBy(xXY as number, y!)
    return this
  }

  moveByCeil(x: number, y: number): this
  moveByCeil(xy: Readonly<XY<number>>): this
  moveByCeil(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveByCeil(xXY as number, y!)
    return this
  }

  moveByFloor(x: number, y: number): this
  moveByFloor(xy: Readonly<XY<number>>): this
  moveByFloor(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveByFloor(xXY as number, y!)
    return this
  }

  moveByRound(x: number, y: number): this
  moveByRound(xy: Readonly<XY<number>>): this
  moveByRound(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveByRound(xXY as number, y!)
    return this
  }

  moveByTrunc(x: number, y: number): this
  moveByTrunc(xy: Readonly<XY<number>>): this
  moveByTrunc(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveByTrunc(xXY as number, y!)
    return this
  }

  /** Reposition the box to arguments. */
  moveTo(x: number, y: number): this
  moveTo(xy: Readonly<XY<number>>): this
  moveTo(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveTo(xXY as number, y!)
    return this
  }

  moveToCeil(x: number, y: number): this
  moveToCeil(xy: Readonly<XY<number>>): this
  moveToCeil(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveToCeil(xXY as number, y!)
    return this
  }

  moveToFloor(x: number, y: number): this
  moveToFloor(xy: Readonly<XY<number>>): this
  moveToFloor(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveToFloor(xXY as number, y!)
    return this
  }

  moveToRound(x: number, y: number): this
  moveToRound(xy: Readonly<XY<number>>): this
  moveToRound(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveToRound(xXY as number, y!)
    return this
  }

  moveToTrunc(x: number, y: number): this
  moveToTrunc(xy: Readonly<XY<number>>): this
  moveToTrunc(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveToTrunc(xXY as number, y!)
    return this
  }

  /** Center the box on arguments. */
  moveCenterTo(x: number, y: number): this
  moveCenterTo(xy: Readonly<XY<number>>): this
  moveCenterTo(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveCenterTo(xXY as number, y!)
    return this
  }

  moveCenterToCeil(x: number, y: number): this
  moveCenterToCeil(xy: Readonly<XY<number>>): this
  moveCenterToCeil(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveCenterToCeil(xXY as number, y!)
    return this
  }

  moveCenterToFloor(x: number, y: number): this
  moveCenterToFloor(xy: Readonly<XY<number>>): this
  moveCenterToFloor(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveCenterToFloor(xXY as number, y!)
    return this
  }

  moveCenterToRound(x: number, y: number): this
  moveCenterToRound(xy: Readonly<XY<number>>): this
  moveCenterToRound(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveCenterToRound(xXY as number, y!)
    return this
  }

  moveCenterToTrunc(x: number, y: number): this
  moveCenterToTrunc(xy: Readonly<XY<number>>): this
  moveCenterToTrunc(xXY: number | Readonly<XY<number>>, y?: number): this {
    this.bounds.moveCenterToTrunc(xXY as number, y!)
    return this
  }

  /**
   * Recomputes as a front-facing Box range with coordinates reordered such that
   * each component of start is less than or equal to end. The result is always
   * unflipped.
   */
  order(): this {
    this.#bounds.order()
    return this
  }

  orderClamp(): this {
    this.#bounds.orderClamp()
    return this
  }

  toString(): string {
    const wlbhl = parseWrapLayerByHeightLayer(this.#wrapLayerByHeightLayer)
    return `Sprite {id=${this.film.id} box=${this.bounds.toString()} ` +
      `layer=${wlbhl.layer} layerByHeight=${wlbhl.layerByHeight} ` +
      `wrap=${wlbhl.wrap.toString()}}`
  }

  /** Width (negative when flipped). */
  get w(): I16 {
    return this.#bounds.w
  }

  /** The box dimensions. */
  get wh(): I16XY {
    return this.#bounds.wh
  }

  get wrapLayerByHeightLayer(): U16 {
    return this.#wrapLayerByHeightLayer
  }

  /** The box coordinates. */
  get xy(): I16XY {
    return this.#bounds.xy
  }

  get x(): I16 {
    return this.#bounds.x
  }

  get y(): I16 {
    return this.#bounds.y
  }
}

/** @internal */
export function parseWrapLayerByHeightLayer(
  wrapLayerByHeightLayer: U16,
): WrapLayerByHeightLayer {
  const wrapX = (wrapLayerByHeightLayer >> WrapXShift) & WrapXMask
  const wrapY = (wrapLayerByHeightLayer >> WrapYShift) & WrapYMask
  const layerByHeight = (wrapLayerByHeightLayer >> LayerByHeightShift) &
    LayerByHeightMask
  const layer = U8((wrapLayerByHeightLayer >> LayerShift) & LayerMask)
  return {
    wrap: new I4XY(I4.mod(wrapX), I4.mod(wrapY)),
    layerByHeight: layerByHeight == LayerByHeightFlag,
    layer,
  }
}

/** @internal */
export function serializeWrapLayerByHeightLayer(
  wrapXY: I4XY,
  layerByHeight: boolean,
  layer: U8,
): U16 {
  const wrap = ((wrapXY.x & WrapXMask) << WrapXShift) |
    ((wrapXY.y & WrapYMask) << WrapYShift)
  const layerByHeightFlag = layerByHeight
    ? LayerByHeightFlag
    : LayerByOriginFlag
  return U16(
    wrap | (layerByHeightFlag << LayerByHeightShift) |
      ((layer & LayerMask) << LayerShift),
  )
}
