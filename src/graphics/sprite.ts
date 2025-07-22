import {
  type Anim,
  type Atlas,
  celMillis,
  type TagFormat
} from '../graphics/atlas.ts'
import { type Box, boxHits, type WH, type XY } from '../types/geo.ts'
import type { Millis } from '../types/time.ts'

export const drawableBytes: number = 11

/**
 * everything not requiring an atlas. the box is the drawn region. assume little
 * endian.
 *
 * 0 xxxx xxxx x (8x fixed-point). 1b sign, 16b int, 3b fraction.
 * 1 xxxx xxxx
 * 2 yyyy xxxx y.
 * 3 yyyy yyyy
 * 4 yyyy yyyy
 * 5 sxyz llll stretch, flip x, flip y, zend, z layer (4b).
 * 6 wwww wwww width. zero means discard.
 * 7 hhhh wwww height. zero means discard.
 * 8 hhhh hhhh
 * 9 iiic cccc animation ID [0, 1023], animation cel [0, 15], reserved (2b).
 * a riii iiii
 *
 * @internal
 */
export abstract class Drawable implements Box {
  #offset: number = 0
  readonly #view: DataView

  constructor(view: DataView, i: number) {
    this.#view = view
    this.i = i
  }

  above(draw: Readonly<Drawable>): boolean {
    const compare = this.z === draw.z
      ? (draw.zend ? draw.y + draw.h : draw.y)
        - (this.zend ? this.y + this.h : this.y)
      : this.z - draw.z
    return compare < 0
  }

  get cel(): number {
    const iiic_cccc = this.#view.getUint8(this.#offset + 9)
    return iiic_cccc & 0x1f
  }

  /** [0, maxAnimCels]. set to Framer.age % (1000 / maxAnimCels) to start at the beginning. can actually return 2x max cels */
  set cel(cel: number) {
    const iiic_cccc = this.#view.getUint8(this.#offset + 9)
    this.#view.setUint8(this.#offset + 9, iiic_cccc & ~0x1f | cel & 0x1f)
  }

  /** test if render area overlaps box or sprite render area. */
  clips(box: Readonly<XY & Partial<WH>>): boolean {
    return boxHits(this, box)
  }

  get flipX(): boolean {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    return !!(sxyz_llll & 0x40)
  }

  set flipX(flip: boolean) {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    this.#view.setUint8(this.#offset + 5, sxyz_llll & ~0x40 | -flip & 0x40)
  }

  get flipY(): boolean {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    return !!(sxyz_llll & 0x20)
  }

  set flipY(flip: boolean) {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    this.#view.setUint8(this.#offset + 5, sxyz_llll & ~0x20 | -flip & 0x20)
  }

  get h(): number {
    const h12_wwww = this.#view.getUint16(this.#offset + 7, true)
    return h12_wwww >>> 4
  }

  /** [0, 4095]. */
  set h(h: number) {
    const h12_wwww = this.#view.getUint16(this.#offset + 7, true)
    this.#view.setUint16(
      this.#offset + 7,
      h12_wwww & ~(0xfff << 4) | ((h & 0xfff) << 4),
      true
    )
  }

  get i(): number {
    return this.#offset / drawableBytes
  }

  set i(i: number) {
    this.#offset = i * drawableBytes
  }

  get id(): number {
    const r_i10_c5 = this.#view.getUint16(this.#offset + 9, true)
    return (r_i10_c5 >>> 5) & 0x3ff
  }

  /** [0, 1023]. */
  set id(id: number) {
    const r_i10_c5 = this.#view.getUint16(this.#offset + 9, true)
    this.#view.setUint16(
      this.#offset + 9,
      r_i10_c5 & ~(0x3ff << 5) | ((id & 0x3ff) << 5),
      true
    )
  }

  // to-do: rotate.
  // to-do: scale.
  // to-do: switch between AABB collisions. make rotation optional on Box.

  get stretch(): boolean {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    return !!(sxyz_llll & 0x80)
  }

  /** wrap texture (default) or stretch to width and height. */
  set stretch(stretch: boolean) {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    this.#view.setUint8(this.#offset + 5, sxyz_llll & ~0x80 | -stretch & 0x80)
  }

  get w(): number {
    const hhhh_w12 = this.#view.getUint16(this.#offset + 6, true)
    return hhhh_w12 & 0xfff
  }

  /** [0, 4095]. */
  set w(w: number) {
    const hhhh_w12 = this.#view.getUint16(this.#offset + 6, true)
    this.#view.setUint16(this.#offset + 6, hhhh_w12 & ~0xfff | w & 0xfff, true)
  }

  get x(): number {
    const y12_x20 = this.#view.getUint32(this.#offset + 0, true)
    return ((y12_x20 << 12) >> 12) / 8 // signed shift.
  }

  /** [-65536, 65535.875] with .125 granularity. */
  set x(x: number) {
    const y12_x20 = this.#view.getUint32(this.#offset + 0, true)
    this.#view.setUint32(
      this.#offset + 0,
      y12_x20 & ~0xf_ffff | ((x * 8) & 0xf_ffff),
      true
    )
  }

  get y(): number {
    const sxyz_llll_y20_xxxx = this.#view.getUint32(this.#offset + 2, true)
    return ((sxyz_llll_y20_xxxx << 8) >> 12) / 8 // signed shift.
  }

  /** [-65536, 65535.875] with .125 granularity. */
  set y(y: number) {
    const sxyz_llll_y20_xxxx = this.#view.getUint32(this.#offset + 2, true)
    this.#view.setUint32(
      this.#offset + 2,
      sxyz_llll_y20_xxxx & ~(0xf_ffff << 4) | (((y * 8) & 0xf_ffff) << 4),
      true
    )
  }

  get z(): number {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    return sxyz_llll & 0xf
  }

  /** layer [0 (closest), 14 (furthest)]; 15 is hidden. */
  set z(z: number) {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    this.#view.setUint8(this.#offset + 5, sxyz_llll & ~0xf | z & 0xf)
  }

  get zend(): boolean {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    return !!(sxyz_llll & 0x10)
  }

  /** z-order by top (default) or bottom of box. */
  set zend(end: boolean) {
    const sxyz_llll = this.#view.getUint8(this.#offset + 5)
    this.#view.setUint8(this.#offset + 5, sxyz_llll & ~0x10 | -end & 0x10)
  }
}

export class Sprite<T extends TagFormat> extends Drawable {
  readonly #atlas: Readonly<Atlas<T>>
  readonly #framer: {readonly age: Millis}

  constructor(
    view: DataView,
    i: number,
    atlas: Readonly<Atlas<T>>,
    framer: {readonly age: Millis}
  ) {
    super(view, i)
    this.#atlas = atlas
    this.#framer = framer
  }

  get anim(): Anim<T> {
    return this.#atlas.anim[this.tag]
  }

  get hitbox(): Box | undefined {
    const {hitbox} = this.anim
    if (!hitbox) return
    return {
      x: this.x + (this.flipX ? this.w - hitbox.w - hitbox.x : hitbox.x),
      y: this.y + (this.flipY ? this.h - hitbox.h - hitbox.y : hitbox.y),
      w: hitbox.w,
      h: hitbox.h
    }
  }

  hits(box: Readonly<XY | Box>): boolean {
    const hitbox = this.hitbox
    if (!hitbox) return false
    const hurtbox = box instanceof Sprite ? box.hurtbox : box
    return !!hurtbox && boxHits(hitbox, hurtbox)
  }

  get hurtbox(): Box | undefined {
    const {hurtbox} = this.anim
    if (!hurtbox) return
    return {
      x: this.x + (this.flipX ? this.w - hurtbox.w - hurtbox.x : hurtbox.x),
      y: this.y + (this.flipY ? this.h - hurtbox.h - hurtbox.y : hurtbox.y),
      w: hurtbox.w,
      h: hurtbox.h
    }
  }

  /** true if animation has played. */
  get looped(): boolean {
    // this comparison resets after the second loop since cel can only count to
    // 2 * anim.cels.
    return Math.abs(this.#framerCel - this.cel) >= this.anim.cels
  }

  /** sets cel to animation start. */
  reset(): void {
    this.cel = this.#framerCel // let the setter truncate.
  }

  get tag(): T {
    return this.#atlas.tag[this.id]!
  }

  /** sets animation, resets cel, dimensions, hitbox, and hurtbox. */
  set tag(tag: T) {
    const anim = this.#atlas.anim[tag]
    this.w = anim.w
    this.h = anim.h
    this.id = anim.id
    this.reset()
  }

  override toString(): string {
    return `${this.tag} (${this.x} ${this.y} ${this.z}) ${this.w}×${this.h}`
  }

  /** current fractional cel in [0, 2 * anim.cels). */
  get #framerCel(): number {
    const cel = this.#framer.age / celMillis
    return cel % (2 * this.anim.cels)
  }
}
