import type {Box} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'

/** every animation is padded to 16 cels as needed by repeating the sequence. */
export const animCels: number = 16
/** max animation loop duration. */
export const animMillis: Millis = 1000 as Millis
/** 62.5 millis. */
export const celMillis: Millis = (animMillis / animCels) as Millis

export type Atlas = {
  anim: {[tag: string]: Anim}
  /**
   * cell source XYWH by `Anim.id` and `Anim.cel`. every animation is padded to
   * 16 cels (`maxAnimCels`) as needed by repeating the sequence.
   */
  cels: number[]
  /** tag by `Anim.id`. */
  tags: string[]
}

export type Anim = {
  /** number of cels in the original animation (no wrapping). */
  cels: number
  /** outgoing collision rectangle (red / blue). */
  hitbox?: Box | undefined
  /** incoming collision rectangle (green / blue). */
  hurtbox?: Box | undefined
  /** atlas tag index. */
  id: number
  /** clipbox / source width. */
  w: number
  /** clipbox / source height. */
  h: number
}

/** `--tagname-format={filestem}--{animation}`. */
export type TagFormat = `${string}--${string}`
