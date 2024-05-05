import type {Box, WH} from '../types/2d.js'

export type Anim<T> = {
  readonly hitbox: Readonly<Box>
  /** Atlas.cels index, a multiple of 16 (maxAnimCels). */
  readonly id: number
  readonly tag: T & TagFormat
} & Readonly<WH>

/** `--tagname-format={title}--{tag}`. */
export type TagFormat = `${string}--${string}`
