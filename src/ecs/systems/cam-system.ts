import { I16 } from '@/oidlib'
import { Cam, System, Viewport } from '@/void'

export interface CamSet {
  readonly cam: Cam
}

export class CamSystem implements System<CamSet> {
  query = new Set(['cam'] as const)
  #updateEnt: (cam: Cam) => void

  constructor(updateEnt?: (cam: Cam) => void) {
    this.#updateEnt = updateEnt ?? (() => {})
  }

  updateEnt(set: CamSet): void {
    const { cam } = set

    cam.clientViewportWH.set(Viewport.clientViewportWH(window))
    cam.nativeViewportWH.set(
      Viewport.nativeViewportWH(window, cam.clientViewportWH),
    )
    cam.scale = Viewport.scale(cam.nativeViewportWH, cam.minViewport, I16(0))
    cam.viewport.wh = Viewport.camWH(cam.nativeViewportWH, cam.scale)

    this.#updateEnt(cam)
  }
}
