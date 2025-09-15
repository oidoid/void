import type {TagFormat} from '../graphics/atlas.ts'
import type {Cam} from '../graphics/cam.ts'
import {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {type Box, boxHits, type WH, type XY} from '../types/geo.ts'
import type {VoidT} from '../void.ts'
import type {Ent} from './ent.ts'

type Button = 'L' | 'R' | 'U' | 'D'

export class CursorEnt<Tag extends TagFormat> implements Ent {
  keyboard: boolean = false
  readonly #sprite: Sprite<Tag>

  constructor(v: VoidT<string, Tag>, tag: Tag) {
    this.#sprite = v.pool.alloc()
    this.#sprite.tag = tag
    this.#sprite.z = Layer.Hidden
  }

  free(v: VoidT<Button, Tag>): void {
    v.pool.free(this.#sprite)
  }

  hitbox(cam: Readonly<Cam>, coords: 'Level' | 'Client'): Box {
    const lvl = coords === 'Level'
    const hitbox = this.#sprite.hitbox
    if (!hitbox) throw Error('cursor has no hitbox')
    if (lvl) return hitbox
    const xy = cam.toXYClient(hitbox)
    return {x: xy.x, y: xy.y, w: hitbox.w, h: hitbox.h}
  }

  hits(
    cam: Readonly<Cam>,
    box: Readonly<XY & Partial<WH>>,
    coords: 'Level' | 'Client'
  ): boolean {
    return boxHits(this.hitbox(cam, coords), box)
  }

  // never just do ui state unless writing to invalid.
  // make getters too generally
  // to-do: update me as first ent
  update(v: VoidT<Button, Tag>): boolean | undefined {
    if (v.input.point?.invalid && v.input.point?.type === 'Mouse') {
      this.#sprite.x = v.input.point.local.x
      this.#sprite.y = v.input.point.local.y
      this.#sprite.z = Layer.UITop
      return true
    }

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
      this.#sprite.z = Layer.UITop

      return true
    }
  }
}
