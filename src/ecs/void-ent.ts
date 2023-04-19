import {
  CursorEnt,
  FollowCamEnt,
  FollowDpadEnt,
  FollowPointEnt,
  FPSEnt,
  TextEnt,
} from '@/void'
import { SpriteEnt } from './sprite-ent.ts'

export type VoidEnt =
  & SpriteEnt
  & CursorEnt
  & FollowCamEnt
  & FollowDpadEnt
  & FollowPointEnt
  & FPSEnt
  & TextEnt
