import type {TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {type Box, boxHits, type WH, type XY} from '../types/geo.ts'
import type {VoidT} from '../void.ts'
import type {Ent} from './ent.ts'

export type CursorButton = 'L' | 'R' | 'U' | 'D'

export class CursorEnt<Tag extends TagFormat> implements Ent {
  keyboard: boolean = false
  readonly #sprite: Sprite<Tag>

  constructor(v: VoidT<string, Tag>, tag: Tag) {
    this.#sprite = v.pool.alloc()
    this.#sprite.tag = tag
    this.#sprite.z = Layer.Hidden
  }

  free(v: VoidT<CursorButton, Tag>): void {
    v.pool.free(this.#sprite)
  }

  hitbox(v: Readonly<VoidT<string, Tag>>, coords: 'Level' | 'UI'): Box {
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
    v: Readonly<VoidT<string, Tag>>,
    box: Readonly<XY & Partial<WH>>,
    coords: 'Level' | 'UI'
  ): boolean {
    return boxHits(this.hitbox(v, coords), box)
  }

  // never just do ui state unless writing to invalid.
  // make getters too generally
  // to-do: update me as first ent
  update(v: VoidT<CursorButton, Tag>): boolean | undefined {
    if (v.input.point?.invalid) {
      this.#sprite.x = v.input.point.local.x
      this.#sprite.y = v.input.point.local.y
      this.#sprite.z =
        v.input.point?.type === 'Mouse' ? Layer.Top : Layer.Hidden
      return true
    }

    // to-do: `Input.keyboard.invalid` test.
    if (v.input.invalid && !this.keyboard) {
      const z = this.#sprite.z
      this.#sprite.z = Layer.Hidden
      return z !== Layer.Hidden
    }

    if (this.keyboard && v.input.isAnyOn('L', 'R', 'U', 'D')) {
      const epsilon = 1
      if (v.input.isOn('L')) this.#sprite.x -= epsilon
      if (v.input.isOn('R')) this.#sprite.x += epsilon
      if (v.input.isOn('U')) this.#sprite.y -= epsilon
      if (v.input.isOn('D')) this.#sprite.y += epsilon
      this.#sprite.z = Layer.Top // to-do: expose.

      return true
    }
  }
}
