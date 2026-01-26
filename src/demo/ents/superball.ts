import type * as V from '../../index.ts'

export type SuperballEnt = V.HookEnt<SuperballHook>

export class SuperballHook implements V.Hook {
  readonly query = 'superball & sprite'

  update(ent: SuperballEnt, v: V.Void): void {
    ent.sprite.x += ent.superball.vx * v.tick.s
    ent.sprite.y += ent.superball.vy * v.tick.s

    const left = v.cam.x
    const right = v.cam.x + v.cam.w - ent.sprite.w
    const top = v.cam.y
    const bottom = v.cam.y + v.cam.h - ent.sprite.h

    if (ent.sprite.x < left) {
      ent.sprite.x = left
      ent.superball.vx = Math.abs(ent.superball.vx)
    } else if (ent.sprite.x > right) {
      ent.sprite.x = right
      ent.superball.vx = -Math.abs(ent.superball.vx)
    }

    if (ent.sprite.y < top) {
      ent.sprite.y = top
      ent.superball.vy = Math.abs(ent.superball.vy)
    } else if (ent.sprite.y > bottom) {
      ent.sprite.y = bottom
      ent.superball.vy = -Math.abs(ent.superball.vy)
    }

    ent.sprite.angle += ent.superball.vx * v.tick.s

    ent.invalid = true
  }
}
