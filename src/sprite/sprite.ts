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

/** A renderable animation. */
export class Sprite implements Bitmap {
  readonly #animator: Animator
  readonly #bounds: Box
  readonly #hitbox: Box
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
    this.#hitbox = film.sliceBounds.copy()
    this.#hitbox.x = this.#bounds.x +
      (this.flipX ? (this.#hitbox.w - this.#hitbox.x) : this.#hitbox.x)
    this.#hitbox.y = this.#bounds.y +
      (this.flipY ? (this.#hitbox.h - this.#hitbox.y) : this.#hitbox.y)
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
    if (film == null) return
    this.#bounds.w = Math.abs(this.#bounds.w) * (this.flipX ? -1 : 1)
    this.#bounds.h = Math.abs(this.#bounds.h) * (this.flipY ? -1 : 1)

    const hitbox = this.#animator.film.sliceBounds
    this.#hitbox.x = this.#bounds.x +
      (this.flipX ? (hitbox.w - hitbox.x) : hitbox.x)
    this.#hitbox.y = this.#bounds.y +
      (this.flipY ? (hitbox.h - hitbox.y) : hitbox.y)
    this.#hitbox.wh.set(hitbox.wh)
  }

  /** Rendered width (w) × height (h) (may be negative if flipped). */
  get area(): number {
    return this.#bounds.area
  }

  /**
   * The rendered size. This bounds usually matches Cel.bounds but may be
   * smaller or larger.
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
  compareDepth(sprite: Sprite): number {
    const { layerByHeight: lhsLayerByHeight, layer: lhsLayer } =
      parseWrapLayerByHeightLayer(this.#wrapLayerByHeightLayer)
    const { layerByHeight: rhsLayerByHeight, layer: rhsLayer } =
      parseWrapLayerByHeightLayer(sprite.#wrapLayerByHeightLayer)
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
    if (this.flipX === flip) return
    this.#bounds.w = Math.abs(this.#bounds.w) * (flip ? -1 : 1)
    const hitbox = this.#animator.film.sliceBounds
    this.#hitbox.x = this.#bounds.x + (flip ? (hitbox.w - hitbox.x) : hitbox.x)
  }

  get flipY(): boolean {
    return this.#bounds.h < 0
  }

  set flipY(flip: boolean) {
    if (this.flipY === flip) return
    this.#bounds.h = Math.abs(this.#bounds.h) * (flip ? -1 : 1)
    const hitbox = this.#animator.film.sliceBounds
    this.#hitbox.y = this.#bounds.y + (flip ? (hitbox.h - hitbox.y) : hitbox.y)
  }

  /** Height (negative when flipped). */
  get h(): number {
    return this.#bounds.h
  }

  set h(h: number) {
    this.#bounds.h = h
  }

  get hitbox(): Box {
    return this.#hitbox
  }

  hits(xy: Readonly<XY>): boolean
  hits(box: Readonly<Box>): boolean
  hits(sprite: Readonly<Sprite>): boolean
  hits(xyBoxSprite: Readonly<Box | Sprite | XY>): boolean {
    if (xyBoxSprite instanceof Box || xyBoxSprite instanceof XY) {
      return this.#hitbox.intersects(<XY> xyBoxSprite)
    }

    const sprite = <Sprite> xyBoxSprite
    return this.#hitbox.intersects(sprite.hitbox)
  }

  /** True if this is in front of sprite. */
  isAbove(sprite: Sprite): boolean {
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

  move(xy: Readonly<XY>): void {
    this.x = xy.x
    this.y = xy.y
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

  get wh(): XY {
    return this.#bounds.wh
  }

  get wrapLayerByHeightLayer(): number {
    return this.#wrapLayerByHeightLayer
  }

  get x(): number {
    return this.#bounds.x
  }

  set x(x: number) {
    this.#hitbox.x += x - this.#bounds.x
    this.#bounds.x = x
  }

  get y(): number {
    return this.#bounds.y
  }

  set y(y: number) {
    this.#hitbox.y += y - this.#bounds.y
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
