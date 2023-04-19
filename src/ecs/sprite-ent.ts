import { Sprite } from '@/void'

export interface SpriteEnt {
  sprites: [Sprite, ...Sprite[]]
  visible?: true
}
