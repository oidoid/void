import {
  CursorEnt,
  FollowCamEnt,
  FollowPointEnt,
  FPSEnt,
  Sprite,
  TextEnt,
} from '@/void'

export type VoidEnt =
  & CursorEnt
  & FollowCamEnt
  & FPSEnt
  & TextEnt
  & FollowPointEnt
  & { sprite: Sprite; sprites: Sprite[] }
