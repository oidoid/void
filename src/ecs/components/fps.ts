export interface FPS {
  prev: number
  next: { readonly created: number; frames: number }
}
