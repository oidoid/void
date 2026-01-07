import {
  type Anim,
  type Atlas,
  animCels,
  celMillis,
  type Tag
} from '../graphics/atlas.ts'
import type {Block} from '../mem/pool.ts'
import {
  type Box,
  boxHits,
  boxIntersect,
  type WH,
  type XY
} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'
import {mod} from '../utils/math.ts'
import {isUILayer, Layer} from './layer.ts'

export type DrawablePool = {
  free(block: Block): void
  view: DataView<ArrayBuffer>
}

/** must be a multiple of 4 (`UNSIGNED_INT`). */
export const drawableBytes: number = 16
/** granularity (0.015625) of drawable coords. */
export const drawableEpsilon: number = 1 / 64
export const drawableMaxWH: Readonly<WH> = {w: 4095, h: 4095}

/**
 * everything not requiring an atlas. the box is the drawn region. assume little
 * endian.
 *
 * 0 xxxx xxxx x [-131072, 131071.984375] (1/64th fixed-point). 1b sign, 17b
 * 1 xxxx xxxx int, 6b fraction.
 * 2 xxxx xxxx
 * 3 yyyy yyyy y.
 * 4 yyyy yyyy
 * 5 yyyy yyyy
 * 6 sxyz llll stretch, flip x, flip y, zend, z layer (4b).
 * 7 wwww wwww width [0, 4095]. zero means discard.
 * 8 hhhh wwww height. zero means discard.
 * 9 hhhh hhhh
 * a iiic cccc animation ID [0, 2047], animation cel [0, 31].
 * b iiii iiii
 * c rrrr rrrv reserved, visible.
 * d rrrr rrrr
 * e rrrr rrrr
 * f rrrr rrrr
 *
 * animations default to looping without CPU interaction.
 * @internal
 */
export abstract class Drawable implements Block, Box {
  i: number
  readonly #pool: Readonly<DrawablePool>

  constructor(pool: Readonly<DrawablePool>, i: number) {
    this.#pool = pool
    this.i = i
  }

  above(draw: Readonly<Drawable>): boolean {
    const compare =
      this.z === draw.z
        ? (this.zend ? this.y + this.h : this.y) -
          (draw.zend ? draw.y + draw.h : draw.y)
        : this.z - draw.z
    return compare > 0
  }

  get cel(): number {
    const iiic_cccc = this.#pool.view.getUint8(this.i + 10)
    return iiic_cccc & 0x1f
  }

  /**
   * [0, 31]. rendered cel offset. call reset() to play animation from start.
   */
  set cel(cel: number) {
    const iiic_cccc = this.#pool.view.getUint8(this.i + 10)
    this.#pool.view.setUint8(this.i + 10, (iiic_cccc & ~0x1f) | (cel & 0x1f))
  }

  /**
   * `this` is a clipbox but sometimes a copy or non-Sprite instance is needed.
   */
  get clipbox(): Box {
    return {x: this.x, y: this.y, w: this.w, h: this.h}
  }

  /** test if render area overlaps box or sprite render area. */
  clips(box: Readonly<XY & Partial<WH>>): boolean {
    return boxHits(this, box)
  }

  /** like `clips()` but can supports different world and UI layers. */
  clipsZ(draw: Readonly<Drawable>, cam: Readonly<XY>): boolean {
    if (this.ui === draw.ui) return this.clips(draw)
    const clipbox = {
      x: draw.x + (draw.ui ? 1 : -1) * Math.floor(cam.x),
      y: draw.y + (draw.ui ? 1 : -1) * Math.floor(cam.y),
      w: draw.w,
      h: draw.h
    }
    return boxHits(this, clipbox)
  }

  get flipX(): boolean {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    return !!(sxyz_llll & 0x40)
  }

  set flipX(flip: boolean) {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    this.#pool.view.setUint8(this.i + 6, (sxyz_llll & ~0x40) | (-flip & 0x40))
  }

  get flipY(): boolean {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    return !!(sxyz_llll & 0x20)
  }

  set flipY(flip: boolean) {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    this.#pool.view.setUint8(this.i + 6, (sxyz_llll & ~0x20) | (-flip & 0x20))
  }

  free(): void {
    this.#pool.free(this)
  }

  get h(): number {
    const h12_wwww = this.#pool.view.getUint16(this.i + 8, true)
    return h12_wwww >>> 4
  }

  /** [0, 4095]. */
  set h(h: number) {
    const h12_wwww = this.#pool.view.getUint16(this.i + 8, true)
    this.#pool.view.setUint16(
      this.i + 8,
      (h12_wwww & ~(0xfff << 4)) | ((h & 0xfff) << 4),
      true
    )
  }

  get id(): number {
    const i11_c5 = this.#pool.view.getUint16(this.i + 10, true)
    return (i11_c5 >>> 5) & 0x7ff
  }

  /** [0, 2047]. */
  set id(id: number) {
    const i11_c5 = this.#pool.view.getUint16(this.i + 10, true)
    this.#pool.view.setUint16(
      this.i + 10,
      (i11_c5 & ~(0x7ff << 5)) | ((id & 0x7ff) << 5),
      true
    )
  }

  /**
   * reset most values that wouldn't be configured when setting the tag. used
   * for reinitialization on pool allocation.
   */
  init(): void {
    this.cel = 0
    this.flipX = false
    this.flipY = false
    this.h = 0
    this.id = 0
    this.stretch = false
    this.visible = true
    this.w = 0
    this.x = 0
    this.y = 0
    this.z = Layer.Bottom
    this.zend = false
  }

  get stretch(): boolean {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    return !!(sxyz_llll & 0x80)
  }

  /** wrap texture (default) or stretch to width and height. */
  set stretch(stretch: boolean) {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    this.#pool.view.setUint8(
      this.i + 6,
      (sxyz_llll & ~0x80) | (-stretch & 0x80)
    )
  }

  get ui(): boolean {
    return isUILayer(this.z)
  }

  get visible(): boolean {
    const rrrr_rrrv = this.#pool.view.getUint8(this.i + 12)
    return (rrrr_rrrv & 0x1) === 0x1
  }

  set visible(visible: boolean) {
    const rrrr_rrrv = this.#pool.view.getUint8(this.i + 12)
    this.#pool.view.setUint8(
      this.i + 12,
      (rrrr_rrrv & ~0x1) | (visible ? 0x1 : 0x0)
    )
  }

  get w(): number {
    const hhhh_w12 = this.#pool.view.getUint16(this.i + 7, true)
    return hhhh_w12 & 0xfff
  }

  /** [0, 4095]. */
  set w(w: number) {
    const hhhh_w12 = this.#pool.view.getUint16(this.i + 7, true)
    this.#pool.view.setUint16(
      this.i + 7,
      (hhhh_w12 & ~0xfff) | (w & 0xfff),
      true
    )
  }

  get x(): number {
    const y8_x24 = this.#pool.view.getUint32(this.i + 0, true)
    return ((y8_x24 << 8) >> 8) / 64 // signed shift.
  }

  /** [-131072, 131071.984375] with 1/64th (0.015625) granularity. */
  set x(x: number) {
    const y8_x24 = this.#pool.view.getUint32(this.i + 0, true)
    this.#pool.view.setUint32(
      this.i + 0,
      (y8_x24 & ~0xff_ffff) | ((x * 64) & 0xff_ffff),
      true
    )
  }

  get y(): number {
    const sxyz_llll_y24 = this.#pool.view.getUint32(this.i + 3, true)
    return ((sxyz_llll_y24 << 8) >> 8) / 64 // signed shift.
  }

  /** [-131072, 131071.984375] with 1/64th (0.015625) granularity. */
  set y(y: number) {
    const sxyz_llll_y24 = this.#pool.view.getUint32(this.i + 3, true)
    this.#pool.view.setUint32(
      this.i + 3,
      (sxyz_llll_y24 & ~0xff_ffff) | ((y * 64) & 0xff_ffff),
      true
    )
  }

  get z(): Layer {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    return (sxyz_llll & 0xf) as Layer
  }

  /** layer [0 (bottom), 15 (top)]. */
  set z(z: Layer) {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    this.#pool.view.setUint8(this.i + 6, (sxyz_llll & ~0xf) | (z & 0xf))
  }

  get zend(): boolean {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    return !!(sxyz_llll & 0x10)
  }

  /** z-order by top (default) or bottom of box. */
  set zend(end: boolean) {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    this.#pool.view.setUint8(this.i + 6, (sxyz_llll & ~0x10) | (-end & 0x10))
  }
}

export class Sprite extends Drawable {
  readonly #atlas: Readonly<Atlas>
  #hitbox: Box | undefined
  #hurtbox: Box | undefined
  readonly #looper: {readonly age: Millis}

  constructor(
    pool: Readonly<DrawablePool>,
    i: number,
    atlas: Readonly<Atlas>,
    looper: {readonly age: Millis}
  ) {
    super(pool, i)
    this.#atlas = atlas
    this.#looper = looper
  }

  get anim(): Anim {
    return this.#atlas.anim[this.tag]!
  }

  diagonalize(dir: Readonly<XY>): void {
    diagonalize(this, dir.x * dir.y)
  }

  override get flipX(): boolean {
    return super.flipX
  }

  override set flipX(flip: boolean) {
    if (this.flipX === flip) return
    super.flipX = flip
    this.#hitbox = undefined
    this.#hurtbox = undefined
  }

  override get flipY(): boolean {
    return super.flipY
  }

  override set flipY(flip: boolean) {
    if (this.flipY === flip) return
    super.flipY = flip
    this.#hitbox = undefined
    this.#hurtbox = undefined
  }

  override get h(): number {
    return super.h
  }

  override set h(h: number) {
    if (this.h === h) return
    super.h = h
    this.#hitbox = undefined
    this.#hurtbox = undefined
  }

  hit(box: Readonly<Box>): Box {
    return boxIntersect(
      this.hitbox ?? this,
      box instanceof Sprite ? (box.hurtbox ?? box) : box
    )
  }

  /** floored hitbox. */
  get hitbox(): Readonly<Box> | undefined {
    if (this.#hitbox) return this.#hitbox
    const {hitbox} = this.anim
    if (!hitbox) return
    return (this.#hitbox ??= {
      x: Math.floor(
        this.x + (this.flipX ? this.w - hitbox.w - hitbox.x : hitbox.x)
      ),
      y: Math.floor(
        this.y + (this.flipY ? this.h - hitbox.h - hitbox.y : hitbox.y)
      ),
      w: hitbox.w,
      h: hitbox.h
    })
  }

  /**
   * use `clips()` to test only clipbox of this and box. hitbox and hurtbox
   * default to clipbox.
   */
  hits(box: Readonly<XY | Box>): boolean {
    const hurtbox = box instanceof Sprite ? (box.hurtbox ?? box) : box
    return boxHits(this.hitbox ?? this, hurtbox)
  }

  /** like `hits()` but can supports different world and UI layers. */
  hitsZ(sprite: Readonly<Sprite>, cam: Readonly<XY>): boolean {
    if (this.ui === sprite.ui) return this.hits(sprite)
    const hurtbox = sprite.hurtbox ? {...sprite.hurtbox} : sprite.clipbox
    hurtbox.x += (sprite.ui ? 1 : -1) * Math.floor(cam.x)
    hurtbox.y += (sprite.ui ? 1 : -1) * Math.floor(cam.y)
    return boxHits(this.hitbox ?? this, hurtbox)
  }

  /** floored hurtbox. */
  get hurtbox(): Readonly<Box> | undefined {
    if (this.#hurtbox) return this.#hurtbox
    const {hurtbox} = this.anim
    if (!hurtbox) return
    return (this.#hurtbox ??= {
      x: Math.floor(
        this.x + (this.flipX ? this.w - hurtbox.w - hurtbox.x : hurtbox.x)
      ),
      y: Math.floor(
        this.y + (this.flipY ? this.h - hurtbox.h - hurtbox.y : hurtbox.y)
      ),
      w: hurtbox.w,
      h: hurtbox.h
    })
  }

  override get id(): number {
    return super.id
  }

  override set id(id: number) {
    if (this.id === id) return
    super.id = id
    this.#hitbox = undefined
    this.#hurtbox = undefined
  }

  /** true if animation has played once. */
  get looped(): boolean {
    // this comparison resets after the second loop since cel can only count to
    // 2 * anim.cels.
    return mod(this.looperCel - this.cel, animCels * 2) >= this.anim.cels
  }

  /** current fractional cel in [0, 2 * anim.cels). */
  get looperCel(): number {
    const cel = this.#looper.age / celMillis
    return cel % (this.anim.cels * 2)
  }

  get midHit(): XY {
    const box = this.hitbox ?? this
    return {x: box.x + box.w / 2, y: box.y + box.h / 2}
  }

  get midHurt(): XY {
    const box = this.hurtbox ?? this
    return {x: box.x + box.w / 2, y: box.y + box.h / 2}
  }

  /** sets cel to animation start. */
  reset(): void {
    this.cel = this.looperCel // setter truncates.
  }

  get tag(): Tag {
    return this.#atlas.tags[this.id]!
  }

  /** sets animation, resets cel, dimensions, hitbox, and hurtbox. */
  set tag(tag: Tag) {
    const anim = this.#atlas.anim[tag]!
    this.w = anim.w
    this.h = anim.h
    this.id = anim.id
    this.reset()
  }

  override toString(): string {
    return `Sprite{${this.tag} (${this.x} ${this.y} ${this.z}) ${this.w}×${this.h}}`
  }

  override get w(): number {
    return super.w
  }

  override set w(w: number) {
    if (this.w === w) return
    super.w = w
    this.#hitbox = undefined
    this.#hurtbox = undefined
  }

  override get x(): number {
    return super.x
  }

  override set x(x: number) {
    if (this.x === x) return
    super.x = x
    this.#hitbox = undefined
    this.#hurtbox = undefined
  }

  override get y(): number {
    return super.y
  }

  override set y(y: number) {
    if (this.y === y) return
    super.y = y
    this.#hitbox = undefined
    this.#hurtbox = undefined
  }
}

/**
 * center component fractions for synchronized 45 degree diagonal movement.
 * @arg dir positive if x and y are both increasing or decreasing, negative if
 *          opposing, zero if either are static.
 */
export function diagonalize(xy: XY, dir: number): void {
  if (!dir) return
  xy.x = Math.floor(xy.x) + 0.5
  xy.y = Math.floor(xy.y) + 0.5 - (dir > 0 ? 0 : drawableEpsilon)
}

/** truncate to nearest drawable quantum. */
export function truncDrawableEpsilon(x: number): number {
  return Math.trunc(x / drawableEpsilon) * drawableEpsilon
}
