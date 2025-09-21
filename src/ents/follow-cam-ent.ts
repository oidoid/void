import type {TagFormat} from '../graphics/atlas.ts'
import type {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {
  type CompassDir,
  type WH,
  whAssign,
  whEq,
  type XY,
  xyAssign,
  xyEq
} from '../types/geo.ts'
import type {VoidT} from '../void.ts'
import type {Ent} from './ent.ts'

// to-do: unclear if this is needless abstraction for `Cam.follow()`.
export class FollowCamEnt<Tag extends TagFormat> implements Ent {
  #fill: 'X' | 'Y' | 'XY' | undefined
  #invalid: boolean = true
  readonly #modulo: XY = {x: 0, y: 0}
  readonly #pad: WH = {w: 0, h: 0}
  #pivot: CompassDir
  readonly #sprite: Sprite<Tag>

  constructor(v: VoidT<string, Tag>, tag: Tag, pivot: CompassDir) {
    this.#sprite = v.pool.alloc()
    this.#sprite.tag = tag
    this.#pivot = pivot
  }

  get fill(): 'X' | 'Y' | 'XY' | undefined {
    return this.#fill
  }

  set fill(fill: 'X' | 'Y' | 'XY' | undefined) {
    if (this.#fill === fill) return
    this.#fill = fill
    this.#invalid = true
  }

  get h(): number {
    return this.#sprite.h
  }

  set h(h: number) {
    if (this.#sprite.h === h) return
    this.#sprite.h = h
    this.#invalid = true
  }

  get modulo(): Readonly<XY> {
    return this.#modulo
  }

  set modulo(modulo: Readonly<XY>) {
    if (xyEq(modulo, this.#modulo)) return
    xyAssign(this.#modulo, modulo)
    this.#invalid = true
  }

  get pad(): Readonly<WH> {
    return this.#pad
  }

  set pad(pad: Readonly<WH>) {
    if (whEq(pad, this.#pad)) return
    whAssign(this.#pad, pad)
    this.#invalid = true
  }

  free(v: VoidT<string, Tag>): void {
    v.pool.free(this.#sprite)
  }

  get pivot(): CompassDir {
    return this.#pivot
  }

  set pivot(pivot: CompassDir) {
    if (this.#pivot === pivot) return
    this.#pivot = pivot
    this.#invalid = true
  }

  update(v: VoidT<string, Tag>): boolean | undefined {
    if (!this.#invalid && !v.cam.invalid) return
    const follow = v.cam.follow(
      {w: this.#sprite.w, h: this.#sprite.h},
      this.#sprite.z,
      this.#pivot,
      {fill: this.#fill, modulo: this.#modulo, pad: this.#pad}
    )
    this.#sprite.x = follow.x
    this.#sprite.y = follow.y
    this.#invalid = false
    return true
  }

  get w(): number {
    return this.#sprite.w
  }

  set w(w: number) {
    if (this.#sprite.w === w) return
    this.#sprite.w = w
    this.#invalid = true
  }

  get z(): Layer {
    return this.#sprite.z
  }

  set z(z: Layer) {
    this.#sprite.z = z
  }
}
