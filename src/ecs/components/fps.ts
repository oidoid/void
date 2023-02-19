import { Uint } from '@/ooz'

export interface FPS {
  prev: number
  next: { readonly created: number; frames: Uint }
}
