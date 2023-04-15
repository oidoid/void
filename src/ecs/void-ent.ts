import {
  CursorEnt,
  FollowCamEnt,
  FollowDpadEnt,
  FollowPointEnt,
  FPSEnt,
  Sprite,
  TextEnt,
} from '@/void'

export type VoidEnt =
  & { sprites: [Sprite, ...Sprite[]] }
  & CursorEnt
  & FollowCamEnt
  & FollowDpadEnt
  & FollowPointEnt
  & FPSEnt
  & TextEnt
