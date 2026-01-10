import * as V from '../../index.ts'

export class CamHook implements V.Hook {
  readonly query = 'cam'

  update(_ent: V.CamEnt, v: V.Void): void {
    if (v.input.isAnyOnStart('U', 'D', 'L', 'R')) v.cam.diagonalize(v.input.dir)

    const len = V.floorDrawEpsilon(25 * v.tick.s)
    v.cam.x += v.input.dir.x * len
    v.cam.y += v.input.dir.y * len

    if (v.input.wheel?.delta.xy.y)
      v.cam.zoomOut -= v.input.wheel.delta.client.y * 0.01

    v.cam.update(v.canvas)
  }
}
