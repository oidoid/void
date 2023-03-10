import { I16 } from '@/ooz'
import { Cam, QueryEnt, System, Viewport } from '@/void'

export type CamEnt = QueryEnt<{ cam: Cam }, typeof query>

const query = 'cam'

export class CamSystem implements System<CamEnt> {
  readonly query = query
  #runEnt: (cam: Cam) => void

  constructor(runEnt?: (cam: Cam) => void) {
    this.#runEnt = runEnt ?? (() => {})
  }

  runEnt(ent: CamEnt): void {
    const { cam } = ent
    cam.clientViewportWH.set(Viewport.clientViewportWH(window))
    cam.nativeViewportWH.set(
      Viewport.nativeViewportWH(window, cam.clientViewportWH),
    )
    cam.scale = Viewport.scale(cam.nativeViewportWH, cam.minViewport, I16(0))
    cam.viewport.wh = Viewport.camWH(cam.nativeViewportWH, cam.scale)

    this.#runEnt(cam)
  }
}
