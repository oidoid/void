import * as V from '../../index.ts'

export class CamSys implements V.Sys {
  readonly query = 'cam' as const

  update(_ent: V.CamEnt, v: V.Void): void {
    if (v.input.isAnyOnStart('U', 'D', 'L', 'R')) v.cam.diagonalize(v.input.dir)

    const len = V.truncDrawableEpsilon(25 * v.tick.s)
    if (v.input.isOn('U')) v.cam.y -= len
    if (v.input.isOn('D')) v.cam.y += len
    if (v.input.isOn('L')) v.cam.x -= len
    if (v.input.isOn('R')) v.cam.x += len

    if (v.input.wheel?.delta.xy.y)
      v.cam.zoomOut -= v.input.wheel.delta.client.y * 0.01

    v.cam.update(v.canvas)
  }
}
