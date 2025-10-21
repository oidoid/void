import type {TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {type Box, boxHits, type WH, type XY} from '../types/geo.ts'
import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'

/**
 * update this ent first. always prefer testing against cursor, not input, in
 * other ents. the cursor may be moved by keyboard and has a hitbox.
 */
export class CursorEnt<out Tag extends TagFormat> implements Ent<Tag> {
  keyboard: boolean = false
  readonly #sprite: Sprite<Tag>
  #pick: Tag
  #point: Tag

  constructor(v: Void<Tag, string>, point: Tag, pick?: Tag | undefined) {
    this.#point = point
    this.#pick = pick ?? this.#point
    this.#sprite = v.sprites.alloc()
    this.#sprite.tag = point
    this.#sprite.z = Layer.Hidden
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

  update(v: Void<Tag, 'L' | 'R' | 'U' | 'D'>): boolean | undefined {
    if (v.input.point?.invalid) {
      this.#sprite.tag = v.input.point.click ? this.#pick : this.#point
      this.#sprite.xy = v.input.point.local
      this.#sprite.z =
        v.input.point?.type === 'Mouse' ? Layer.Top : Layer.Hidden
      return true
    }

    if (this.keyboard && v.input.isAnyOn('L', 'R', 'U', 'D')) {
      const epsilon = 1
      if (v.input.isOn('L')) this.#sprite.x -= epsilon
      if (v.input.isOn('R')) this.#sprite.x += epsilon
      if (v.input.isOn('U')) this.#sprite.y -= epsilon
      if (v.input.isOn('D')) this.#sprite.y += epsilon
      this.#sprite.z = Layer.Top

      return true
    }
  }

  get visible(): boolean {
    return this.#sprite.z !== Layer.Hidden
  }
}
