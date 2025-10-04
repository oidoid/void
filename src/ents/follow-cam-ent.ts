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
import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'

// to-do: unclear if this is needless abstraction for `Cam.follow()`.
export class FollowCamEnt<Tag extends TagFormat> implements Ent {
  #fill: 'X' | 'Y' | 'XY' | undefined
  #invalid: boolean = true
  readonly #margin: WH = {w: 0, h: 0}
  readonly #modulo: XY = {x: 0, y: 0}
  #pivot: CompassDir
  readonly #sprite: Sprite<Tag>

  constructor(v: Void<Tag, string>, tag: Tag, pivot: CompassDir) {
    this.#sprite = v.sprites.alloc()
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

  free(v: Void<Tag, string>): void {
    v.sprites.free(this.#sprite)
  }

  get h(): number {
    return this.#sprite.h
  }

  set h(h: number) {
    if (this.#sprite.h === h) return
    this.#sprite.h = h
    this.#invalid = true
  }

  get margin(): Readonly<WH> {
    return this.#margin
  }

  set margin(margin: Readonly<WH>) {
    if (whEq(margin, this.#margin)) return
    whAssign(this.#margin, margin)
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

  get pivot(): CompassDir {
    return this.#pivot
  }

  set pivot(pivot: CompassDir) {
    if (this.#pivot === pivot) return
    this.#pivot = pivot
    this.#invalid = true
  }

  update(v: Void<Tag, string>): boolean | undefined {
    if (!this.#invalid && !v.cam.invalid) return
    const follow = v.cam.follow(
      {w: this.#sprite.w, h: this.#sprite.h},
      this.#sprite.z,
      this.#pivot,
      {fill: this.#fill, modulo: this.#modulo, margin: this.#margin}
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
