import type * as V from '../../engine/index.ts'

export type SuperballEnt = V.HookEnt<SuperballHook>

export class SuperballHook implements V.Hook {
  readonly query = 'superball & sprite'

  update(ent: SuperballEnt, v: V.Void): void {
    ent.sprite.x += ent.superball.vx * v.tick.s
    ent.sprite.y += ent.superball.vy * v.tick.s

    const {hitbox} = ent.sprite
    if (!v.level || !hitbox) return

    const bounds = v.level
    const left = bounds.x
    const right = bounds.x + bounds.w - hitbox.w
    const top = bounds.y
    const bottom = bounds.y + bounds.h - hitbox.h

    if (hitbox.x < left) {
      ent.sprite.x = left
      ent.superball.vx = Math.abs(ent.superball.vx)
      ent.superball.vy += (v.random.num - 0.5) * 20
    } else if (hitbox.x > right) {
      ent.sprite.x = right
      ent.superball.vx = -Math.abs(ent.superball.vx)
      ent.superball.vy += (v.random.num - 0.5) * 20
    }

    if (hitbox.y < top) {
      ent.sprite.y = top
      ent.superball.vy = Math.abs(ent.superball.vy)
      ent.superball.vx += (v.random.num - 0.5) * 20
    } else if (hitbox.y > bottom) {
      ent.sprite.y = bottom
      ent.superball.vy = -Math.abs(ent.superball.vy)
      ent.superball.vx += (v.random.num - 0.5) * 20
    }

    ent.sprite.angle += ent.superball.vx * v.tick.s

    ent.invalid = v.tick.start
  }
}
