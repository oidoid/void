import { XY } from '@/ooz'
import { Cam, FollowCamConfig, Game, QueryEnt, Sprite, System } from '@/void'

export type FollowCamEnt = QueryEnt<
  { followCam: FollowCamConfig; sprite: Sprite },
  typeof query
>

const query = 'followCam & sprite'

export class FollowCamSystem implements System<FollowCamEnt> {
  readonly query = query
  runEnt(ent: FollowCamEnt, game: Game<FollowCamEnt>): void {
    const { followCam, sprite } = ent
    const pad = new XY(followCam.pad?.x ?? 0, followCam.pad?.y ?? 0)
    if (followCam.fill === 'X' || followCam.fill === 'XY') {
      sprite.w = game.cam.viewport.w - pad.x * 2
    }
    if (followCam.fill === 'Y' || followCam.fill === 'XY') {
      sprite.h = game.cam.viewport.h - pad.y * 2
    }
    sprite.x = computeX(sprite, game.cam, followCam)
    sprite.y = computeY(sprite, game.cam, followCam)
  }
}

function computeX(
  sprite: Readonly<Sprite>,
  cam: Readonly<Cam>,
  component: Readonly<FollowCamConfig>,
): number {
  const camW = cam.viewport.w
  const spriteW = Math.abs(sprite.w)
  const padW = component.pad?.x ?? 0
  let x = cam.viewport.x
  switch (component.orientation) {
    case 'Southwest':
    case 'West':
    case 'Northwest':
      x += padW
      break
    case 'Southeast':
    case 'East':
    case 'Northeast':
      x += camW - (spriteW + padW)
      break
    case 'North':
    case 'South':
    case 'Center':
      x += Math.trunc(camW / 2) - (Math.trunc(spriteW / 2) + padW)
      break
  }
  const modulo = (component.modulo?.x ?? x) || 1
  return x - x % modulo
}

function computeY(
  sprite: Readonly<Sprite>,
  cam: Readonly<Cam>,
  component: Readonly<FollowCamConfig>,
): number {
  const camH = cam.viewport.h
  const spriteH = Math.abs(sprite.h)
  const padH = component.pad?.y ?? 0
  let y = cam.viewport.y
  switch (component.orientation) {
    case 'North':
    case 'Northeast':
    case 'Northwest':
      y += padH
      break
    case 'Southeast':
    case 'South':
    case 'Southwest':
      y += camH - (spriteH + padH)
      break
    case 'East':
    case 'West':
    case 'Center':
      y += Math.trunc(camH / 2) - (Math.trunc(spriteH / 2) + padH)
      break
  }
  const modulo = (component.modulo?.y ?? y) || 1
  return y - y % modulo
}
