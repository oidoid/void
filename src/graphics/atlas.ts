import type { Box } from '../types/geo.ts'

/** every animation is padded to 16 cels as needed by repeating the sequence. */
export const maxAnimCels: number = 16
export const maxAnimMillis: number = 1000
export const celMillis: number = maxAnimMillis / maxAnimCels

export type Atlas<T extends TagFormat = TagFormat> = {
  anim: AnimByTag<T>,
  /** tag by ID. */ tag: T[]
}

export type AnimByTag<T extends TagFormat = TagFormat> = { [tag in T]: Anim<T> }

export type Anim<T extends TagFormat = TagFormat> = {
  /** number of cels in the original animation (no wrapping). */
  cels: number,
  /** outgoing collision rectangle (red / blue). */
  hitbox?: Readonly<Box> | undefined,
  /** incoming collision rectangle (green / blue). */
  hurtbox?: Readonly<Box> | undefined,
  /**
   * Atlas.cels index, a multiple of 16 (maxAnimCels). each cel is shown for
   * ~63 millis.
   */
  id: number,
  tag: T,
  /** source x. */ x: number,
  /** source y. */ y: number,
  /** clipbox / source width. */ w: number,
  /** clipbox / source height. */ h: number
}

/** `--tagname-format={filestem}--{animation}`. */
export type TagFormat = `${string}--${string}`
