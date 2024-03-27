import type {Box, WH, XY} from '../types/2d.js'
import type {AnimTag} from './aseprite.js'

export type Atlas<T extends AnimTag = AnimTag> = {
  readonly [tag in T]: Anim<T>
}
export type Anim<T extends AnimTag = AnimTag> = {
  readonly cels: readonly Readonly<XY>[]
  readonly hitbox: Readonly<Box>
  /** A multiple of 16 (maxAnimCels). */
  readonly id: number
  readonly tag: T
} & Readonly<WH>
