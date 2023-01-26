import { I16, Immutable } from '@/oidlib'
import { Cam, System, Viewport } from '@/void'

export interface CamSet {
  readonly cam: Cam
}

export const CamSystem: System<CamSet> = Immutable({
  query: new Set(['cam']),
  updateEnt,
})

function updateEnt(set: CamSet): void {
  const { cam } = set

  cam.clientViewportWH.set(Viewport.clientViewportWH(window))
  cam.nativeViewportWH.set(
    Viewport.nativeViewportWH(window, cam.clientViewportWH),
  )
  cam.scale = Viewport.scale(cam.nativeViewportWH, cam.minViewport, I16(0))
  cam.viewport.wh = Viewport.camWH(cam.nativeViewportWH, cam.scale)

  const camOffsetX = Math.trunc((cam.viewport.w - cam.minViewport.x) / 2)
  cam.viewport.x = I16(-camOffsetX + camOffsetX % 8)
}
