import type * as V from '../../engine/index.ts'

export type SuperballEnt = V.HookEnt<SuperballHook>

export class SuperballHook implements V.Hook {
  readonly query = 'superball & sprite'

  update(ent: SuperballEnt, v: V.Void): void {
    ent.sprite.x += ent.superball.vx * v.tick.s
    ent.sprite.y += ent.superball.vy * v.tick.s

    const bounds = v.level ?? v.cam
    const left = bounds.x
    const right = bounds.x + bounds.w - ent.sprite.hitbox!.w
    const top = bounds.y
    const bottom = bounds.y + bounds.h - ent.sprite.hitbox!.h

    if (v.loader.cursor?.sprite.hitsZ(ent.sprite, v.cam)) {
      if (v.input.isOn('A')) {
        ent.sprite.free()
        v.loader.zoo.default.delete(ent)
        return
      }
      ent.superball.vx = -ent.superball.vx
      ent.superball.vy = -ent.superball.vy
      ent.sprite.x += ent.superball.vx * 2 * v.tick.s
      ent.sprite.y += ent.superball.vy * 2 * v.tick.s
    }

    if (ent.sprite.x < left) {
      ent.sprite.x = left
      ent.superball.vx = Math.abs(ent.superball.vx)
      ent.superball.vy += (v.random.num - 0.5) * 20
    } else if (ent.sprite.x > right) {
      ent.sprite.x = right
      ent.superball.vx = -Math.abs(ent.superball.vx)
      ent.superball.vy += (v.random.num - 0.5) * 20
    }

    if (ent.sprite.y < top) {
      ent.sprite.y = top
      ent.superball.vy = Math.abs(ent.superball.vy)
      ent.superball.vx += (v.random.num - 0.5) * 20
    } else if (ent.sprite.y > bottom) {
      ent.sprite.y = bottom
      ent.superball.vy = -Math.abs(ent.superball.vy)
      ent.superball.vx += (v.random.num - 0.5) * 20
    }

    ent.sprite.angle += ent.superball.vx * v.tick.s

    ent.invalid = true
  }
}
