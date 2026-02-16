import type {Box} from '../types/geo.ts'
import type {Millis} from '../types/time.ts'

/** every animation is padded to 16 cels as needed by repeating the sequence. */
export const animCels: number = 16
/** max animation loop duration. */
export const animMillis: Millis = 1000 as Millis
/** 62.5 millis. */
export const celMillis: Millis = (animMillis / animCels) as Millis

export type Atlas = {
  anim: {[tag in Tag]: Anim}
  /**
   * cell source XYWH by `Anim.id` and `Anim.cel`. every animation is padded to
   * 16 cels (`maxAnimCels`) as needed by repeating the sequence.
   */
  celXYWH: number[]
  /** tag by `Anim.id`. */
  tags: Tag[]
}

export interface AtlasMap {
  /** the default atlas is available from the initial frame. */
  default: Atlas
}

/** arbitrary data. */
// biome-ignore lint/suspicious/noEmptyInterface:;
export interface AnimData {}

export type Anim = {
  /**
   * number of cels in a full animation cycle including cels extended for
   * duration and the second half of pingpongs.
   */
  cels: number
  data?: AnimData
  /** outgoing collision rectangle (red / blue). */
  hitbox?: Box
  /** incoming collision rectangle (green / blue). */
  hurtbox?: Box
  /** atlas tag index. */
  id: number
  /** clipbox / source width. */
  w: number
  /** clipbox / source height. */
  h: number
}

/** `--tagname-format={filestem}--{animation}`. */
export type Tag = ReturnType<ReturnTag>

export interface ReturnTag {
  // biome-ignore lint/style/useShorthandFunctionType:;
  (): `${string}--${string}`
}
