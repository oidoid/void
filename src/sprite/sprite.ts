import { Animator, Cel, Film } from '@/atlas-pack'
import { Box, PartialXY, wrapNum, XY } from '@/ooz'
import {
  Bitmap,
  BitmapFlipXMask,
  BitmapFlipXShift,
  BitmapFlipYMask,
  BitmapFlipYShift,
  BitmapLayerAnchorEndMask,
  BitmapLayerAnchorEndShift,
  BitmapLayerMask,
  BitmapLayerShift,
  BitmapWrapXMask,
  BitmapWrapXShift,
  BitmapWrapXWidth,
  BitmapWrapYMask,
  BitmapWrapYShift,
  BitmapWrapYWidth,
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
  readonly anchorEnd?: boolean | undefined
  /** Offset sprite. Capped to I4. */
  readonly wrap?: PartialXY | undefined
  /** Mirror sprite  (render + hitbox). Defaults to unflipped. */
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

/** A renderable animation. */
export class Sprite implements Bitmap {
  readonly #animator: Animator
  readonly #bounds: Box
  readonly #hitbox: Box
  #flipWrapAnchorLayer: number

  constructor(film: Film, layer: number, props?: SpriteProps) {
    this.#animator = new Animator(film, props?.time)
    const flipX = props?.flip === 'X' || props?.flip === 'XY'
    const flipY = props?.flip === 'Y' || props?.flip === 'XY'
    this.#bounds = new Box(
      props?.xy?.x ?? props?.x ?? 0,
      props?.xy?.y ?? props?.y ?? 0,
      props?.wh?.x ?? props?.w ?? film.wh.x,
      props?.wh?.y ?? props?.h ?? film.wh.y,
    )
    this.#hitbox = film.sliceBounds.copy()
    this.#hitbox.x = this.#bounds.x +
      (flipX ? (this.#hitbox.w - this.#hitbox.x) : this.#hitbox.x)
    this.#hitbox.y = this.#bounds.y +
      (flipY ? (this.#hitbox.h - this.#hitbox.y) : this.#hitbox.y)

    this.#flipWrapAnchorLayer = 0
    this.flipX = flipX
    this.flipY = flipY
    this.wrapX = props?.wrap?.x ?? 0
    this.wrapY = props?.wrap?.y ?? 0
    this.anchorEnd = props?.anchorEnd ?? false
    this.layer = layer
  }

  get anchorEnd(): boolean {
    return !!((this.#flipWrapAnchorLayer >> BitmapLayerAnchorEndShift) &
      BitmapLayerAnchorEndMask)
  }

  set anchorEnd(end: boolean) {
    if (end) this.#flipWrapAnchorLayer |= 1 << BitmapLayerAnchorEndShift
    else this.#flipWrapAnchorLayer &= ~(1 << BitmapLayerAnchorEndShift)
  }

  /**
   * Clear the start time (set the animation to the starting cel) and optionally
   * change the film. This is useful to reset the active film or switch films.
   *
   * Changing the film does not change size but may change hitbox.
   */
  animate(start: number, film?: Film): void {
    this.#animator.reset(start, film)
    if (film == null) return
    this.flipX = !!this.flipX
    this.flipY = !!this.flipY
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
    const lhsAnchorEnd = this.anchorEnd
    const lhsLayer = this.layer
    const rhsAnchorEnd = sprite.anchorEnd
    const rhsLayer = sprite.layer
    return lhsLayer === rhsLayer
      ? (sprite.bounds[rhsAnchorEnd ? 'xy' : 'end'].y -
        this.#bounds[lhsAnchorEnd ? 'xy' : 'end'].y)
      : lhsLayer - rhsLayer
  }

  /** The starting coordinate plus dimensions. */
  get end(): XY {
    return this.#bounds.end
  }

  get film(): Film {
    return this.#animator.film
  }

  get flipWrapAnchorLayer(): number {
    return this.#flipWrapAnchorLayer
  }

  get flipX(): boolean {
    return !!((this.#flipWrapAnchorLayer >> BitmapFlipXShift) &
      BitmapFlipXMask)
  }

  set flipX(flip: boolean) {
    if (flip) this.#flipWrapAnchorLayer |= 1 << BitmapFlipXShift
    else this.#flipWrapAnchorLayer &= ~(1 << BitmapFlipXShift)
    const hitbox = this.#animator.film.sliceBounds
    this.#hitbox.x = this.#bounds.x + (flip ? (hitbox.w - hitbox.x) : hitbox.x)
  }

  get flipY(): boolean {
    return !!((this.#flipWrapAnchorLayer >> BitmapFlipYShift) &
      BitmapFlipYMask)
  }

  set flipY(flip: boolean) {
    if (flip) this.#flipWrapAnchorLayer |= 1 << BitmapFlipYShift
    else this.#flipWrapAnchorLayer &= ~(1 << BitmapFlipYShift)
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
    return (this.#flipWrapAnchorLayer >> BitmapLayerShift) & BitmapLayerMask
  }

  set layer(layer: number) {
    this.#flipWrapAnchorLayer &= ~(BitmapLayerMask << BitmapLayerShift)
    this.#flipWrapAnchorLayer |= (layer & BitmapLayerMask) << BitmapLayerShift
  }

  /** The greatest coordinate of this box. */
  get max(): XY {
    return this.#bounds.max
  }

  /** The least coordinate of this box. */
  get min(): XY {
    return this.#bounds.min
  }

  setXY(xy: Readonly<XY>): void {
    this.x = xy.x
    this.y = xy.y
  }

  toString(): string {
    const flip = this.flipX && this.flipY
      ? 'XY'
      : this.flipX
      ? 'X'
      : this.flipY
      ? 'Y'
      : 'no'
    return `Sprite {id=${this.film.id} box=${this.#bounds} flip=${flip} ` +
      `layer=${this.layer} anchor=${this.anchorEnd ? 'End' : 'Start'} ` +
      `wrap=${new XY(this.wrapX, this.wrapY)}}`
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

  get wrapX(): number {
    return wrapNum(
      (this.#flipWrapAnchorLayer >> BitmapWrapXShift) & BitmapWrapXMask,
      -(2 ** (BitmapWrapXWidth - 1)),
      2 ** (BitmapWrapXWidth - 1),
    )
  }

  set wrapX(wrap: number) {
    this.#flipWrapAnchorLayer &= ~(BitmapWrapXMask << BitmapWrapXShift)
    this.#flipWrapAnchorLayer |= (wrap & BitmapWrapXMask) << BitmapWrapXShift
  }

  get wrapY(): number {
    return wrapNum(
      (this.#flipWrapAnchorLayer >> BitmapWrapYShift) & BitmapWrapYMask,
      -(2 ** (BitmapWrapYWidth - 1)),
      2 ** (BitmapWrapYWidth - 1),
    )
  }

  set wrapY(wrap: number) {
    this.#flipWrapAnchorLayer &= ~(BitmapWrapYMask << BitmapWrapYShift)
    this.#flipWrapAnchorLayer |= (wrap & BitmapWrapYMask) << BitmapWrapYShift
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
