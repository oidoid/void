import type {Box, WH} from '../types/2d.js'

export type Atlas<T> = {
  readonly anim: {readonly [tag in T & TagFormat]: Anim<T>}
  /**
   * animation cel XYWH ordered by ID. every animation is padded to 16 cels
   * (maxAnimCels) as needed by repeating the sequence.
   */
  readonly cels: readonly number[]
}

export type Anim<T> = {
  readonly hitbox: Readonly<Box>
  /** Atlas.cels index, a multiple of 16 (maxAnimCels). */
  readonly id: number
  readonly tag: T & TagFormat
} & Readonly<WH>

/** `--tagname-format={title}--{tag}`. */
export type TagFormat = `${string}--${string}`
