import { Cam, CursorFilmSet, FollowCamConfig, Sprite } from '@/void'

export interface ComponentSet {
  cam: Cam
  cursor: CursorFilmSet
  followCam: FollowCamConfig
  followPoint: Record<never, never>
  sprites: [Sprite, ...Sprite[]]
}
