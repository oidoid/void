import {
  type Anim,
  type Atlas,
  animCels,
  celMillis,
  type Tag
} from '../graphics/atlas.ts'
import type {Block} from '../mem/pool.ts'
import type {SpritePool} from '../mem/sprite-pool.ts'
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

/** must be a multiple of 4 (`UNSIGNED_INT`). */
export const spriteBytes: number = 16
/** granularity (0.015625) of sprite coords. */
export const spriteEpsilon: number = 1 / 64
export const spriteMaxWH: Readonly<WH> = {w: 4095, h: 4095}

/**
 * the box is the drawn region. assume little endian.
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
 * c rrrr rrrh reserved, hidden.
 * d aaaa aaaa angle [0°, 360°) low 8 bits (0.087890625° granularity).
 * e rrrr aaaa angle high 4 bits.
 * f rrrr rrrr reserved.
 *
 * animations default to looping without CPU interaction.
 */
export class Sprite implements Block, Box {
  /** don't set this externally. public for perf. */
  anim: Anim
  i: number
  readonly #atlas: Readonly<Atlas>
  /** cached hitbox. `w: NaN` means dirty. */
  readonly #hitbox: Box = {x: 0, y: 0, w: NaN, h: 0}
  /** cached hurtbox. `w: NaN` means dirty. */
  readonly #hurtbox: Box = {x: 0, y: 0, w: NaN, h: 0}
  readonly #looper: {readonly age: Millis}
  readonly #pool: Readonly<SpritePool>
  #tag: Tag

  constructor(
    pool: Readonly<SpritePool>,
    i: number,
    atlas: Readonly<Atlas>,
    looper: {readonly age: Millis}
  ) {
    this.#tag = atlas.tags[0]!
    this.anim = atlas.anim[this.#tag]!
    this.#pool = pool
    this.i = i
    this.#atlas = atlas
    this.#looper = looper
  }

  above(sprite: Readonly<Sprite>): boolean {
    const compare =
      this.z === sprite.z
        ? (this.zend ? this.y + this.h : this.y) -
          (sprite.zend ? sprite.y + sprite.h : sprite.y)
        : this.z - sprite.z
    return compare > 0
  }

  get angle(): number {
    const r4_a12 = this.#pool.view.getUint16(this.i + 13, true)
    return ((r4_a12 & 0xfff) * 360) / 4096
  }

  /**
   * [0°, 360°). angle in degrees (0.087890625° granularity). rotation is
   * counterclockwise where y-axis is flipped.
   */
  set angle(angle: number) {
    const r4_a12 = this.#pool.view.getUint16(this.i + 13, true)
    const bits = Math.round((angle * 4096) / 360) & 0xfff
    this.#pool.view.setUint16(this.i + 13, (r4_a12 & ~0xfff) | bits, true)
  }

  get cel(): number {
    const iiic_cccc = this.#pool.view.getUint8(this.i + 10)
    return iiic_cccc & 0x1f
  }

  /** [0, 31]. rendered cel offset. call reset() to play animation from start. */
  set cel(cel: number) {
    const iiic_cccc = this.#pool.view.getUint8(this.i + 10)
    this.#pool.view.setUint8(this.i + 10, (iiic_cccc & ~0x1f) | (cel & 0x1f))
  }

  /** test if render area overlaps box or sprite render area. */
  clips(box: Readonly<XY & Partial<WH>>): boolean {
    return boxHits(this, box)
  }

  /** like `clips()` but supports different world and UI layers. expensive. */
  clipsZ(sprite: Readonly<Sprite>, cam: Readonly<XY>): boolean {
    if (this.ui === sprite.ui) return this.clips(sprite)
    const clipbox = {
      x: sprite.x + (sprite.ui ? 1 : -1) * Math.floor(cam.x),
      y: sprite.y + (sprite.ui ? 1 : -1) * Math.floor(cam.y),
      w: sprite.w,
      h: sprite.h
    }
    return boxHits(this, clipbox)
  }

  diagonalize(dir: Readonly<XY>): void {
    diagonalize(this, dir.x * dir.y)
  }

  get flipX(): boolean {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    return !!(sxyz_llll & 0x40)
  }

  set flipX(flip: boolean) {
    // if (this.flipX === flip) return
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    this.#pool.view.setUint8(this.i + 6, (sxyz_llll & ~0x40) | (-flip & 0x40))
    this.#hitbox.w = NaN
    this.#hurtbox.w = NaN
  }

  get flipY(): boolean {
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    return !!(sxyz_llll & 0x20)
  }

  set flipY(flip: boolean) {
    // if (this.flipY === flip) return
    const sxyz_llll = this.#pool.view.getUint8(this.i + 6)
    this.#pool.view.setUint8(this.i + 6, (sxyz_llll & ~0x20) | (-flip & 0x20))
    this.#hitbox.w = NaN
    this.#hurtbox.w = NaN
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

  get hidden(): boolean {
    const rrrr_rrrh = this.#pool.view.getUint8(this.i + 12)
    return (rrrr_rrrh & 0x1) === 0x1
  }

  set hidden(hidden: boolean) {
    const rrrr_rrrh = this.#pool.view.getUint8(this.i + 12)
    this.#pool.view.setUint8(
      this.i + 12,
      (rrrr_rrrh & ~0x1) | (hidden ? 0x1 : 0x0)
    )
  }

  hit(box: Readonly<Box>): Box {
    return boxIntersect(
      this.hitbox ?? this,
      box instanceof Sprite ? (box.hurtbox ?? box) : box
    )
  }

  get hitbox(): Readonly<Box> | undefined {
    if (Number.isNaN(this.#hitbox.w)) {
      const {hitbox} = this.anim
      if (!hitbox) return undefined
      this.#hitbox.x =
        this.x + (this.flipX ? this.w - hitbox.w - hitbox.x : hitbox.x)
      this.#hitbox.y =
        this.y + (this.flipY ? this.h - hitbox.h - hitbox.y : hitbox.y)
      this.#hitbox.w = hitbox.w
      this.#hitbox.h = hitbox.h
    }
    return this.#hitbox
  }

  /**
   * use `clips()` to test only clipbox of this and box. hitbox and hurtbox
   * default to clipbox.
   */
  hits(box: Readonly<XY | Box>): boolean {
    // to-do: is `if (!boxHits(this, box)) return false` faster?
    const hurtbox = box instanceof Sprite ? (box.hurtbox ?? box) : box
    return boxHits(this.hitbox ?? this, hurtbox)
  }

  /** like `hits()` but supports different world and UI layers. expensive. */
  hitsZ(sprite: Readonly<Sprite>, cam: Readonly<XY>): boolean {
    if (this.ui === sprite.ui) return this.hits(sprite)
    const box = sprite.hurtbox ?? sprite
    const hurtbox = {
      x: box.x + (sprite.ui ? 1 : -1) * cam.x,
      y: box.y + (sprite.ui ? 1 : -1) * cam.y,
      w: box.w,
      h: box.h
    }
    return boxHits(this.hitbox ?? this, hurtbox)
  }

  get hurtbox(): Readonly<Box> | undefined {
    if (Number.isNaN(this.#hurtbox.w)) {
      const {hurtbox} = this.anim
      if (!hurtbox) return undefined
      this.#hurtbox.x =
        this.x + (this.flipX ? this.w - hurtbox.w - hurtbox.x : hurtbox.x)
      this.#hurtbox.y =
        this.y + (this.flipY ? this.h - hurtbox.h - hurtbox.y : hurtbox.y)
      this.#hurtbox.w = hurtbox.w
      this.#hurtbox.h = hurtbox.h
    }
    return this.#hurtbox
  }

  get id(): number {
    const i11_c5 = this.#pool.view.getUint16(this.i + 10, true)
    return (i11_c5 >>> 5) & 0x7ff
  }

  /** [0, 2047]. */
  set id(id: number) {
    // if (this.id === id) return
    this.#id = id
  }

  set #id(id: number) {
    const i11_c5 = this.#pool.view.getUint16(this.i + 10, true)
    this.#pool.view.setUint16(
      this.i + 10,
      (i11_c5 & ~(0x7ff << 5)) | ((id & 0x7ff) << 5),
      true
    )
    this.#tag = this.#atlas.tags[id]!
    this.anim = this.#atlas.anim[this.#tag]!
    this.w = this.anim.w
    this.h = this.anim.h
    this.reset()
    this.#hitbox.w = NaN
    this.#hurtbox.w = NaN
  }

  /**
   * reset most values that wouldn't be configured when setting the tag. used
   * for reinitialization on pool allocation.
   */
  init(): void {
    this.#tag = this.#atlas.tags[0]!
    this.#hitbox.w = NaN
    this.#hurtbox.w = NaN
    this.angle = 0
    this.cel = 0
    this.flipX = false
    this.flipY = false
    this.#id = 0 // to-do: reserve ID 0.
    this.stretch = false
    this.hidden = false
    this.x = 0
    this.y = 0
    this.z = Layer.Bottom
    this.zend = false
    this.reset()
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

  get midClip(): XY {
    return {x: this.x + this.w / 2, y: this.y + this.h / 2}
  }

  get midHit(): XY {
    const box = this.hitbox ?? this
    return {x: box.x + box.w / 2, y: box.y + box.h / 2}
  }

  get midHurt(): XY {
    const box = this.hurtbox ?? this
    return {x: box.x + box.w / 2, y: box.y + box.h / 2}
  }

  // to-do: rename rewind.
  /** sets cel to animation start. */
  reset(): void {
    this.cel = this.looperCel // setter truncates.
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

  get tag(): Tag {
    return this.#tag
  }

  /** sets animation, resets cel, dimensions, hitbox, and hurtbox if differs. */
  set tag(tag: Tag) {
    this.id = this.#atlas.anim[tag]!.id
  }

  toString(): string {
    return `Sprite{${this.#tag} (${this.x} ${this.y} ${this.z}) ${this.w}×${this.h}}`
  }

  get ui(): boolean {
    return isUILayer(this.z)
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
    x = (x * 64) & 0xff_ffff
    // if (this.x === x) return
    const y8_x24 = this.#pool.view.getUint32(this.i + 0, true)
    this.#pool.view.setUint32(this.i + 0, (y8_x24 & ~0xff_ffff) | x, true)
    this.#hitbox.w = NaN
    this.#hurtbox.w = NaN
  }

  get y(): number {
    const sxyz_llll_y24 = this.#pool.view.getUint32(this.i + 3, true)
    return ((sxyz_llll_y24 << 8) >> 8) / 64 // signed shift.
  }

  /** [-131072, 131071.984375] with 1/64th (0.015625) granularity. */
  set y(y: number) {
    y = (y * 64) & 0xff_ffff
    // if (this.y === y) return
    const sxyz_llll_y24 = this.#pool.view.getUint32(this.i + 3, true)
    this.#pool.view.setUint32(
      this.i + 3,
      (sxyz_llll_y24 & ~0xff_ffff) | y,
      true
    )
    this.#hitbox.w = NaN
    this.#hurtbox.w = NaN
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

/**
 * center component fractions for synchronized 45 degree diagonal movement.
 * @arg dir positive if x and y are both increasing or decreasing, negative if
 *          opposing, zero if either are static.
 */
export function diagonalize(xy: XY, dir: number): void {
  if (!dir) return
  xy.x = Math.floor(xy.x) + 0.5
  xy.y = Math.floor(xy.y) + 0.5 - (dir > 0 ? 0 : spriteEpsilon)
}

/** floor to nearest sprite quantum. */
export function floorSpriteEpsilon(x: number): number {
  return Math.floor(x / spriteEpsilon) * spriteEpsilon
}
