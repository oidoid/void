import type * as V from '../../engine/index.ts'

export type RotateEnt = V.HookEnt<RotateHook>

/** writes to sprite.angle. */
export class RotateHook implements V.Hook {
  readonly query = 'rotate & sprite'

  update(ent: RotateEnt, v: V.Void): void {
    ent.sprite.angle += ent.rotate.speed * v.tick.s
    ent.invalid = true
  }
}
