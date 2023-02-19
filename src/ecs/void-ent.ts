import {
  CamEnt,
  CursorEnt,
  FollowCamEnt,
  FollowPointEnt,
  FPSEnt,
  RenderEnt,
  TextEnt,
} from '@/void'

export type VoidEnt =
  & Required<CursorEnt>
  & Required<FollowCamEnt>
  & Required<CamEnt>
  & Required<FPSEnt>
  & Required<TextEnt>
  & Required<FollowPointEnt>
  & Required<RenderEnt>
