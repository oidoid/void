import {
  CamSet,
  CursorSet,
  FollowCamSet,
  FollowPointSet,
  FPSSet,
  RenderSet,
  Sprite,
  TextSet,
} from '@/void'

export interface ComponentSet
  extends
    CursorSet,
    FollowCamSet,
    CamSet,
    FPSSet,
    TextSet,
    FollowPointSet,
    RenderSet {
  sprites: [Sprite, ...Sprite[]]
}
