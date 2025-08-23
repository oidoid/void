import type {Box} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'

/** every animation is padded to 16 cels as needed by repeating the sequence. */
export const maxAnimCels: number = 16
export const maxAnimMillis: Millis = 1000 as Millis
export const celMillis: Millis = (maxAnimMillis / maxAnimCels) as Millis

export type Atlas<T extends TagFormat> = {
  /** key order is tag ID. */
  [tag in T]: Anim<T>
}

export type Anim<T extends TagFormat> = {
  /** number of cels in the original animation (no wrapping). */
  cels: number
  /** outgoing collision rectangle (red / blue). */
  hitbox: Box | undefined
  /** incoming collision rectangle (green / blue). */
  hurtbox: Box | undefined
  /**
   * Atlas.cels index, a multiple of 16 (`maxAnimCels`). each cel is shown for
   * ~63 millis (`celMillis`).
   */
  id: number
  tag: T
  /** clipbox / source width. */
  w: number
  /** clipbox / source height. */
  h: number
}

/** `--tagname-format={filestem}--{animation}`. */
export type TagFormat = `${string}--${string}`
