import type {Anim} from './anim.js'

export type Atlas<T> = {
  readonly anim: {readonly [tag in T & string]: Anim<T>}

  /**
   * animation cel XYWH ordered by ID. every animation is padded to 16 cels
   * (maxAnimCels) as needed by repeating the sequence.
   */
  readonly cels: readonly number[]
}
