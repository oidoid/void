import type {Bitmap} from '../renderer/bitmap.js'
import type {Box, WH, XY} from '../types/2d.js'
import type {Anim, TagFormat} from './anim.js'
import type {Atlas} from './atlas.js'

export type SpriteJSON = {
  cel?: number
  flip?: string
  tag: string
  x?: number
  y?: number
  z?: number
  w?: number
  h?: number
  zend?: boolean
}

export class Sprite<T extends TagFormat> implements Bitmap, Box {
  static parse<T extends TagFormat>(
    atlas: Atlas<T>,
    json: Readonly<SpriteJSON>
  ): Sprite<T> {
    if (!(json.tag in atlas.anim))
      throw Error(`atlas missing tag "${json.tag}"`)
    const sprite = new Sprite(atlas, <T>json.tag)
    sprite.cel = json.cel ?? 0
    sprite.flipX = json.flip === 'X' || json.flip === 'XY'
    sprite.flipY = json.flip === 'Y' || json.flip === 'XY'
    sprite.x = json.x ?? 0
    sprite.y = json.y ?? 0
    sprite.z = json.z ?? 0
    sprite.zend = json.zend ?? false
    if (json.w != null) sprite.w = json.w
    if (json.h != null) sprite.h = json.h
    return sprite
  }

  debug?: unknown
  readonly hitbox: Box = {x: 0, y: 0, w: 0, h: 0}

  _iffzz = 0
  _xy = 0
  _wh = 0

  #anim: Anim<T> = <Anim<T>>{}
  readonly #atlas: Atlas<T>

  constructor(atlas: Atlas<T>, tag: T) {
    this.#atlas = atlas
    this.tag = tag // Inits hitbox.
  }

  above(sprite: Readonly<Sprite<T>>): boolean {
    const compare =
      this.z === sprite.z
        ? (sprite.zend ? sprite.y + sprite.h : sprite.y) -
          (this.zend ? this.y + this.h : this.y)
        : this.z - sprite.z
    return compare < 0
  }

  get cel(): number {
    return (this._iffzz >> 6) & 0xf
  }

  /** Set to frame number to start at the beginning. */
  set cel(cel: number) {
    this._iffzz = (this._iffzz & 0xfffffc3f) | ((cel & 0xf) << 6)
  }

  get flipX(): boolean {
    return !!(this._iffzz & 0x20)
  }

  set flipX(flip: boolean) {
    if (this.flipX === flip) return
    this._iffzz = flip ? this._iffzz | 0x20 : this._iffzz & 0xffffffdf
    const {hitbox} = this.#anim
    this.hitbox.x = this.x + (flip ? hitbox.w - hitbox.x : hitbox.x)
  }

  get flipY(): boolean {
    return !!(this._iffzz & 0x10)
  }

  set flipY(flip: boolean) {
    if (this.flipY === flip) return
    const {hitbox} = this.#anim
    this._iffzz = flip ? this._iffzz | 0x10 : this._iffzz & 0xffffffef
    this.hitbox.y = this.y + (flip ? hitbox.h - hitbox.y : hitbox.y)
  }

  get h(): number {
    return this._wh & 0xfff
  }

  set h(h: number) {
    this._wh = (this._wh & 0xfffff000) | (h & 0xfff)
  }

  hits(box: Readonly<XY & Partial<WH>>): boolean {
    if (!this.hitbox.w || !this.hitbox.h) return false
    if (box instanceof Sprite) box = box.hitbox
    return (
      this.hitbox.x < box.x + (box.w ?? 0) &&
      this.hitbox.x + this.hitbox.w > box.x &&
      this.hitbox.y < box.y + (box.h ?? 0) &&
      this.hitbox.y + this.hitbox.h > box.y
    )
  }

  /** Test if bitmap intersects. */
  overlaps(box: Readonly<XY & Partial<WH>>): boolean {
    return (
      this.x < box.x + (box.w ?? 0) &&
      this.x + this.w > box.x &&
      this.y < box.y + (box.h ?? 0) &&
      this.y + this.h > box.y
    )
  }

  get tag(): T {
    return this.#anim.tag
  }

  set tag(tag: T) {
    if (tag === this.#anim.tag) return
    this.#anim = this.#atlas.anim[tag]
    const {hitbox} = this.#anim
    this.hitbox.x = this.x + (this.flipX ? hitbox.w - hitbox.x : hitbox.x)
    this.hitbox.y = this.y + (this.flipY ? hitbox.h - hitbox.y : hitbox.y)
    this.hitbox.w = this.#anim.hitbox.w
    this.hitbox.h = this.#anim.hitbox.h
    this.w = this.#anim.w
    this.h = this.#anim.h
    this._iffzz = (this._iffzz & 0xfffe0003f) | (this.#anim.id << 6)
  }

  toString(): string {
    return `${this.tag} (${this.x}, ${this.y}) ${this.w}×${this.h}`
  }

  get w(): number {
    return (this._wh >> 12) & 0xfff
  }

  set w(w: number) {
    this._wh = (this._wh & 0xff000fff) | ((w & 0xfff) << 12)
  }

  get x(): number {
    return (this._xy >> 16) / 8
  }

  set x(x: number) {
    if (x === this.x) return
    this._xy = (this._xy & 0x0000ffff) | (((8 * x) & 0xffff) << 16)
    const {hitbox} = this.#anim
    this.hitbox.x = this.x + (this.flipX ? hitbox.w - hitbox.x : hitbox.x)
  }

  set xy(xy: Readonly<XY>) {
    this.x = xy.x
    this.y = xy.y
  }

  get y(): number {
    return ((this._xy << 16) >> 16) / 8
  }

  set y(y: number) {
    if (y === this.y) return
    this._xy = (this._xy & 0xffff0000) | ((8 * y) & 0xffff)
    const {hitbox} = this.#anim
    this.hitbox.y = this.y + (this.flipY ? hitbox.h - hitbox.y : hitbox.y)
  }

  get z(): number {
    return this._iffzz & 7
  }

  /** Greater is further. */
  set z(z: number) {
    this._iffzz = (this._iffzz & 0xfffffff8) | (z & 0x7)
  }

  get zend(): boolean {
    return !!(this._iffzz & 0x8)
  }

  set zend(end: boolean) {
    if (end) this._iffzz |= 0x8
    else this._iffzz &= 0xfffffff7
  }
}
