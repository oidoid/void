import type {Anim, TagFormat} from './anim.js'

export type Atlas<T extends TagFormat> = {
  readonly anim: {readonly [tag in T]: Anim<T>}

  /**
   * XYWH animation cels by ID. Every animation is padded to 16 cels
   * (maxAnimCels) as needed by repeating the sequence.
   */
  readonly cels: readonly number[]
}
