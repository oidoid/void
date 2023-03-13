import {
  CursorEnt,
  FollowCamEnt,
  FollowPointEnt,
  FPSEnt,
  RenderEnt,
  TextEnt,
} from '@/void'

export type VoidEnt =
  & CursorEnt
  & FollowCamEnt
  & FPSEnt
  & TextEnt
  & FollowPointEnt
  & RenderEnt
