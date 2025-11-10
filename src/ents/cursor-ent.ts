import type {TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import {type Sprite, truncDrawableEpsilon} from '../graphics/sprite.ts'
import {type Box, boxHits, type WH, type XY} from '../types/geo.ts'
import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'

/**
 * update this ent first. always prefer testing against cursor, not input, in
 * other ents. the cursor may be moved by keyboard and has a hitbox.
 */
export class CursorEnt<Tag extends TagFormat> implements Ent<Tag> {
  /** px / sec, 0 to disable keyboard. */
  keyboard: number = 0
  readonly #bounds: Box = {x: 0, y: 0, w: 0, h: 0}
  readonly #sprite: Sprite<Tag>
  readonly #pick: Tag
  readonly #point: Tag

  constructor(v: Void<Tag, string>, point: Tag, pick?: Tag) {
    this.#point = point
    this.#pick = pick ?? this.#point
    this.#sprite = v.pool.default.alloc()
    this.#sprite.tag = point
    this.#sprite.z = Layer.Hidden
    this.#updateBounds(v)
  }

  free(): void {
    this.#sprite.free()
  }

  hitbox(v: Readonly<Void<Tag, string>>, coords: 'Level' | 'UI'): Box {
    const lvl = coords === 'Level'
    const hitbox = this.#sprite.hitbox
    if (!hitbox) throw Error('cursor has no hitbox')
    return {
      x: (lvl ? Math.floor(v.cam.x) : 0) + hitbox.x,
      y: (lvl ? Math.floor(v.cam.y) : 0) + hitbox.y,
      w: hitbox.w,
      h: hitbox.h
    }
  }

  hits(v: Readonly<Void<Tag, string>>, sprite: Readonly<Sprite<Tag>>): boolean
  hits(
    v: Readonly<Void<Tag, string>>,
    box: Readonly<XY & Partial<WH>>,
    coords: 'Level' | 'UI'
  ): boolean
  hits(
    v: Readonly<Void<Tag, string>>,
    box: Readonly<XY & Partial<WH>>,
    coords?: 'Level' | 'UI'
  ): boolean {
    return (
      this.visible &&
      boxHits(
        this.hitbox(
          v,
          coords == null ? ((box as Sprite<Tag>).ui ? 'UI' : 'Level') : coords
        ),
        box
      )
    )
  }

  update(v: Void<Tag, 'U' | 'D' | 'L' | 'R' | 'A'>): boolean | undefined {
    if (v.input.point?.invalid) {
      this.#sprite.tag = v.input.point.click ? this.#pick : this.#point
      this.#sprite.xy = v.input.point.local
      this.#sprite.z =
        v.input.point?.type === 'Mouse' ? Layer.Top : Layer.Hidden
      return true
    }

    // assume the sprite dimensions don't vary between point and pick. always
    // update in case cam invalidates while keyboard is temporarily off.
    this.#updateBounds(v)

    if (
      this.keyboard &&
      (v.input.dir.x || v.input.dir.y || v.input.isAnyStarted('A'))
    ) {
      this.#sprite.tag = v.input.isOn('A') ? this.#pick : this.#point

      const len = truncDrawableEpsilon(this.keyboard * v.tick.s)

      if (
        v.input.isAnyOnStart('U', 'D', 'L', 'R') &&
        v.input.dir.x &&
        v.input.dir.y
      )
        this.#sprite.diagonalize(v.input.dir)

      if (v.input.dir.x)
        this.#sprite.x = Math.min(
          this.#bounds.x + this.#bounds.w,
          Math.max(this.#bounds.x, this.#sprite.x + v.input.dir.x * len)
        )
      if (v.input.dir.y)
        this.#sprite.y = Math.min(
          this.#bounds.y + this.#bounds.h,
          Math.max(this.#bounds.y, this.#sprite.y + v.input.dir.y * len)
        )
      this.#sprite.z = Layer.Top

      return true
    }
  }

  get visible(): boolean {
    return this.#sprite.z !== Layer.Hidden
  }

  get x(): number {
    return this.#sprite.x
  }

  get y(): number {
    return this.#sprite.y
  }

  #updateBounds(v: Void<Tag, string>): void {
    if (!v.cam.invalid) return
    this.#bounds.x = -this.#sprite.w
    this.#bounds.y = -this.#sprite.h
    this.#bounds.w = v.cam.w + this.#sprite.w
    this.#bounds.h = v.cam.h + this.#sprite.h
  }
}
