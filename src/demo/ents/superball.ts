import type * as V from '../../engine/index.ts'

export type SuperballEnt = V.HookEnt<SuperballHook>

export class SuperballHook implements V.Hook {
  readonly query = 'superball & sprite'

  update(ent: SuperballEnt, v: V.Void): void {
    ent.sprite.x += ent.superball.vx * v.tick.s
    ent.sprite.y += ent.superball.vy * v.tick.s

    const {hitbox} = ent.sprite
    if (!v.level || !hitbox) return

    const left = v.level.x
    const right = v.level.x + v.level.w - hitbox.w
    const top = v.level.y
    const bottom = v.level.y + v.level.h - hitbox.h

    if (hitbox.x < left) {
      ent.sprite.x = left - (hitbox.x - ent.sprite.x)
      ent.superball.vx = Math.abs(ent.superball.vx)
      ent.superball.vy += (v.random.num - 0.5) * 20
    } else if (hitbox.x > right) {
      ent.sprite.x = right - (hitbox.x - ent.sprite.x)
      ent.superball.vx = -Math.abs(ent.superball.vx)
      ent.superball.vy += (v.random.num - 0.5) * 20
    }

    if (hitbox.y < top) {
      ent.sprite.y = top - (hitbox.y - ent.sprite.y)
      ent.superball.vy = Math.abs(ent.superball.vy)
      ent.superball.vx += (v.random.num - 0.5) * 20
    } else if (hitbox.y > bottom) {
      ent.sprite.y = bottom - (hitbox.y - ent.sprite.y)
      ent.superball.vy = -Math.abs(ent.superball.vy)
      ent.superball.vx += (v.random.num - 0.5) * 20
    }

    ent.invalid = v.tick.start
  }
}
