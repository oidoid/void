import {
  type Anim,
  type Atlas,
  animCels,
  celMillis,
  type TagFormat
} from '../graphics/atlas.ts'
import type {Block} from '../mem/pool.ts'
import {type Box, boxHits, type WH, type XY} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'
import {mod} from '../utils/math.ts'
import type {Layer} from './layer.ts'

export const drawableBytes: number = 12
/** granularity (0.015625) of `Drawable` coords. */
export const drawableEpsilon: number = 1 / 64
export const drawableMaxWH: WH = {w: 4095, h: 4095}

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
 *
 * animations default to looping without CPU interaction.
 * @internal
 */
export abstract class Drawable implements Block, Box {
  i: number
  readonly #pool: {readonly view: DataView<ArrayBuffer>}

  constructor(pool: {readonly view: DataView<ArrayBuffer>}, i: number) {
    this.#pool = pool
    this.i = i
  }

  above(draw: Readonly<Drawable>): boolean {
    const compare =
      this.z === draw.z
        ? (draw.zend ? draw.y + draw.h : draw.y) -
          (this.zend ? this.y + this.h : this.y)
        : this.z - draw.z
    return compare < 0
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

  /** test if render area overlaps box or sprite render area. */
  clips(box: Readonly<XY & Partial<WH>>): boolean {
    return boxHits(this, box)
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

  get xy(): XY {
    return {x: this.x, y: this.y}
  }

  set xy(xy: Readonly<XY>) {
    this.x = xy.x
    this.y = xy.y
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

  /** layer [0 (closest), 14 (furthest)]; 15 is hidden. */
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

// to-do: can I declaration merge or namespace merge away from the tag type?
export class Sprite<out Tag extends TagFormat> extends Drawable {
  readonly #atlas: Readonly<Atlas>
  #hitbox: Box | undefined
  #hurtbox: Box | undefined
  readonly #looper: {readonly age: Millis}

  constructor(
    pool: {readonly view: DataView<ArrayBuffer>},
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

  get hitbox(): Box | undefined {
    if (this.#hitbox) return this.#hitbox
    const {hitbox} = this.anim
    if (!hitbox) return
    return (this.#hitbox ??= {
      x: this.x + (this.flipX ? this.w - hitbox.w - hitbox.x : hitbox.x),
      y: this.y + (this.flipY ? this.h - hitbox.h - hitbox.y : hitbox.y),
      w: hitbox.w,
      h: hitbox.h
    })
  }

  hits(box: Readonly<XY | Box>): boolean {
    const hitbox = this.hitbox
    if (!hitbox) return false
    const hurtbox = box instanceof Sprite ? box.hurtbox : box
    return !!hurtbox && boxHits(hitbox, hurtbox)
  }

  get hurtbox(): Box | undefined {
    if (this.#hurtbox) return this.#hurtbox
    const {hurtbox} = this.anim
    if (!hurtbox) return
    return (this.#hurtbox ??= {
      x: this.x + (this.flipX ? this.w - hurtbox.w - hurtbox.x : hurtbox.x),
      y: this.y + (this.flipY ? this.h - hurtbox.h - hurtbox.y : hurtbox.y),
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
    return mod(this.#currentCel - this.cel, animCels * 2) >= this.anim.cels
  }

  /** sets cel to animation start. */
  reset(): void {
    this.cel = this.#currentCel // setter truncates.
  }

  // to-do: unit test and catch up on unit tests elsewhere.

  get tag(): Tag {
    return this.#atlas.tags[this.id] as Tag
  }

  /** sets animation, resets cel, dimensions, hitbox, and hurtbox. */
  set tag(tag: Tag) {
    const anim = this.#atlas.anim[tag]!
    this.w = anim.w
    this.h = anim.h
    this.id = anim.id
    this.reset()
  }

  truncXY(): void {
    this.x = Math.trunc(this.x)
    this.y = Math.trunc(this.y)
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

  /** current fractional cel in [0, 2 * anim.cels). */
  get #currentCel(): number {
    const cel = this.#looper.age / celMillis
    return cel % (this.anim.cels * 2)
  }
}

export function truncDrawableEpsilon(x: number): number {
  return Math.trunc(x / drawableEpsilon) * drawableEpsilon
}
