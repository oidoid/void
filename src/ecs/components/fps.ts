import { Uint } from '@/oidlib'

export interface FPS {
  prev: number
  next: { readonly created: number; frames: Uint }
}
