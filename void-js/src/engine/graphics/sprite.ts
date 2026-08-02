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

  /** sets cel to animation start. */
  rewind(): void {
    this.cel = this.looperCel // setter truncates.
  }
}
