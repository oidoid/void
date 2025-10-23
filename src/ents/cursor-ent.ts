import type {TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import {type Sprite, truncDrawableUnit} from '../graphics/sprite.ts'
import {type Box, boxHits, type WH, type XY} from '../types/geo.ts'
import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'

/**
 * update this ent first. always prefer testing against cursor, not input, in
 * other ents. the cursor may be moved by keyboard and has a hitbox.
 */
export class CursorEnt<out Tag extends TagFormat> implements Ent<Tag> {
  /** px / sec, 0 to disable keyboard. */
  keyboard: number = 0
  readonly #sprite: Sprite<Tag>
  readonly #pick: Tag
  readonly #point: Tag
  readonly #viewport: Box = {x: 0, y: 0, w: 0, h: 0}

  constructor(v: Void<Tag, string>, point: Tag, pick?: Tag | undefined) {
    this.#point = point
    this.#pick = pick ?? this.#point
    this.#sprite = v.sprites.alloc()
    this.#sprite.tag = point
    this.#sprite.z = Layer.Hidden
    this.#updateViewport(v)
  }

  free(v: Void<Tag, string>): void {
    v.sprites.free(this.#sprite)
  }

  hitbox(v: Readonly<Void<Tag, string>>, coords: 'Level' | 'UI'): Box {
    const lvl = coords === 'Level'
    const hitbox = this.#sprite.hitbox
    if (!hitbox) throw Error('cursor has no hitbox')
    return {
      x: (lvl ? v.cam.x : 0) + hitbox.x,
      y: (lvl ? v.cam.y : 0) + hitbox.y,
      w: hitbox.w,
      h: hitbox.h
    }
  }

  hits(
    v: Readonly<Void<Tag, string>>,
    box: Readonly<XY & Partial<WH>>,
    coords: 'Level' | 'UI'
  ): boolean {
    return this.visible && boxHits(this.hitbox(v, coords), box)
  }

  update(v: Void<Tag, 'L' | 'R' | 'U' | 'D' | 'A'>): boolean | undefined {
    if (v.input.point?.invalid) {
      this.#sprite.tag = v.input.point.click ? this.#pick : this.#point
      this.#sprite.xy = v.input.point.local
      this.#sprite.z =
        v.input.point?.type === 'Mouse' ? Layer.Top : Layer.Hidden
      return true
    }

    // assume the sprite dimensions don't vary between point and pick. always
    // update in case cam invalidates while keyboard is temporarily off.
    this.#updateViewport(v)

    if (
      this.keyboard &&
      (v.input.isAnyOn('L', 'R', 'U', 'D') || v.input.isAnyStarted('A'))
    ) {
      this.#sprite.tag = v.input.isOn('A') ? this.#pick : this.#point

      if (v.input.isAnyOnStart('L', 'R', 'U', 'D'))
        this.#sprite.syncFraction(v.input.dir, v.input.isAnyOnStill('L', 'R'))

      const len = truncDrawableUnit(this.keyboard * v.tick.s)

      if (v.input.isOn('L'))
        this.#sprite.x = Math.max(this.#viewport.x, this.#sprite.x - len)
      if (v.input.isOn('R'))
        this.#sprite.x = Math.min(
          this.#viewport.x + this.#viewport.w,
          this.#sprite.x + len
        )
      if (v.input.isOn('U'))
        this.#sprite.y = Math.max(this.#viewport.y, this.#sprite.y - len)
      if (v.input.isOn('D'))
        this.#sprite.y = Math.min(
          this.#viewport.y + this.#viewport.h,
          this.#sprite.y + len
        )
      this.#sprite.z = Layer.Top

      return true
    }
  }

  get visible(): boolean {
    return this.#sprite.z !== Layer.Hidden
  }

  #updateViewport(v: Void<Tag, string>): void {
    if (!v.cam.invalid) return
    this.#viewport.x = -(this.#sprite.w - 1)
    this.#viewport.y = -(this.#sprite.h - 1)
    this.#viewport.w = v.cam.w + this.#sprite.w - 2
    this.#viewport.h = v.cam.h + 2
  }
}
