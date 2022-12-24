import { CursorFilmSet, FollowCamConfig, Sprite } from '@/void';

export interface ComponentSet {
  cursor: CursorFilmSet;
  followCam: FollowCamConfig;
  followPoint: Record<never, never>;
  sprite: Sprite;
}
