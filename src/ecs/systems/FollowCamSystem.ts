import { I16, I16Box, I16XY, Immutable } from '@/oidlib';
import { FollowCamConfig, Sprite, System } from '@/void';
import { ECSUpdate } from '../ECSUpdate.ts';

export interface FollowCamSet {
  readonly followCam: FollowCamConfig;
  readonly sprite: Sprite;
}

export const FollowCamSystem: System<FollowCamSet> = Immutable({
  query: new Set(['followCam', 'sprite']),
  updateEnt,
});

function updateEnt(set: FollowCamSet, update: ECSUpdate): void {
  const { followCam, sprite } = set;
  const pad = I16XY(followCam.pad?.x ?? 0, followCam.pad?.y ?? 0);
  I16Box.sizeTo(
    sprite.bounds,
    I16(
      followCam.fill == 'X' || followCam.fill == 'XY'
        ? (I16Box.width(update.camBounds) - pad.x * 2)
        : sprite.w,
    ),
    I16(
      followCam.fill == 'Y' || followCam.fill == 'XY'
        ? (I16Box.height(update.camBounds) - pad.y * 2)
        : sprite.h,
    ),
  );
  I16Box.moveTo(
    sprite.bounds,
    computeX(sprite, update.camBounds, followCam),
    computeY(sprite, update.camBounds, followCam),
  );
}

function computeX(
  sprite: Readonly<Sprite>,
  cam: Readonly<I16Box>,
  component: Readonly<FollowCamConfig>,
): I16 {
  const camW = I16Box.width(cam);
  const spriteW = Math.abs(sprite.w);
  const padW = component.pad?.x ?? 0;
  let x = cam.start.x;
  switch (component.orientation) {
    case 'Southwest':
    case 'West':
    case 'Northwest':
      x = I16(x + padW);
      break;
    case 'Southeast':
    case 'East':
    case 'Northeast':
      x = I16(x + camW - (spriteW + padW));
      break;
    case 'North':
    case 'South':
    case 'Center':
      x = I16(x + Math.trunc(camW / 2) - (Math.trunc(spriteW / 2) + padW));
      break;
  }
  const modulo = (component.modulo?.x ?? x) || 1;
  return I16(x - x % modulo);
}

function computeY(
  sprite: Readonly<Sprite>,
  cam: Readonly<I16Box>,
  component: Readonly<FollowCamConfig>,
): I16 {
  const camH = I16Box.height(cam);
  const spriteH = Math.abs(sprite.h);
  const padH = component.pad?.y ?? 0;
  let y = cam.start.y;
  switch (component.orientation) {
    case 'North':
    case 'Northeast':
    case 'Northwest':
      y = I16(y + padH);
      break;
    case 'Southeast':
    case 'South':
    case 'Southwest':
      y = I16(y + camH - (spriteH + padH));
      break;
    case 'East':
    case 'West':
    case 'Center':
      y = I16(y + Math.trunc(camH / 2) - (Math.trunc(spriteH / 2) + padH));
      break;
  }
  const modulo = (component.modulo?.y ?? y) || 1;
  return I16(y - y % modulo);
}
