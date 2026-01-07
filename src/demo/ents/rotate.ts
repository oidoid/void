import type * as V from '../../index.ts'

export type Rotate = {speed: number}

export type RotateEnt = V.SysEnt<RotateSys>

/** writes to sprite.angle. */
export class RotateSys implements V.Sys {
  readonly query = 'rotate & sprite'

  update(ent: RotateEnt, v: V.Void): void {
    ent.sprite.angle += ent.rotate.speed * v.tick.s
    ent.invalid = true
  }
}
