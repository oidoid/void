import { I16, Immutable } from '@/oidlib';
import { Cam, System } from '@/void';
import { Viewport } from '../../renderer/Viewport.ts';

export interface CamSet {
  readonly cam: Cam;
}

export const CamSystem: System<CamSet> = Immutable({
  query: new Set(['cam']),
  updateEnt,
});

function updateEnt(set: CamSet): void {
  const { cam } = set;

  ({ x: cam.clientViewportWH.x, y: cam.clientViewportWH.y } = Viewport
    .clientViewportWH(window));
  ({ x: cam.nativeViewportWH.x, y: cam.nativeViewportWH.y } = Viewport
    .nativeViewportWH(window, cam.clientViewportWH));

  cam.scale = Viewport.scale(cam.nativeViewportWH, cam.minViewport, I16(0));
  ({ x: cam.wh.x, y: cam.wh.y } = Viewport.camWH(
    cam.nativeViewportWH,
    cam.scale,
  ));

  const camOffsetX = Math.trunc((cam.wh.x - cam.minViewport.x) / 2);
  cam.xy.x = I16(-camOffsetX + camOffsetX % 8);
}
