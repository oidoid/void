import type * as V from '../../engine/index.ts'

export type SuperballEnt = V.HookEnt<SuperballHook>

export class SuperballHook implements V.Hook {
  readonly query = 'superball & sprite'

  collide(a: SuperballEnt, b: SuperballEnt, v: V.Void): void {
    const hitboxA = a.sprite.hitbox
    const hitboxB = b.sprite.hitbox
    if (!hitboxA || !hitboxB) return
    const dx =
      (Math.min(hitboxA.x + hitboxA.w, hitboxB.x + hitboxB.w) -
        Math.max(hitboxA.x, hitboxB.x)) /
      2
    const dy =
      (Math.min(hitboxA.y + hitboxA.h, hitboxB.y + hitboxB.h) -
        Math.max(hitboxA.y, hitboxB.y)) /
      2
    if (dx <= 0 || dy <= 0) return
    // move by half overlap of min penetration and swap velocities.
    if (dx < dy) {
      const dirY = Math.sign(b.sprite.x - a.sprite.x) || 1
      a.sprite.x += -dirY * dx
      b.sprite.x += dirY * dx
      ;[a.superball.vx, b.superball.vx] = [b.superball.vx, a.superball.vx]
    } else {
      const dirX = Math.sign(b.sprite.y - a.sprite.y) || 1
      a.sprite.y += -dirX * dy
      b.sprite.y += dirX * dy
      ;[a.superball.vy, b.superball.vy] = [b.superball.vy, a.superball.vy]
    }
    a.sprite.angle = v.random.num * 360
    b.sprite.angle = v.random.num * 360
    a.invalid = b.invalid = v.tick.start
  }

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
    } else if (hitbox.x > right) {
      ent.sprite.x = right - (hitbox.x - ent.sprite.x)
      ent.superball.vx = -Math.abs(ent.superball.vx)
    }

    if (hitbox.y < top) {
      ent.sprite.y = top - (hitbox.y - ent.sprite.y)
      ent.superball.vy = Math.abs(ent.superball.vy)
    } else if (hitbox.y > bottom) {
      ent.sprite.y = bottom - (hitbox.y - ent.sprite.y)
      ent.superball.vy = -Math.abs(ent.superball.vy)
    }

    ent.invalid = v.tick.start
  }
}
