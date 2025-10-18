import type {TagFormat} from '../../src/graphics/atlas.ts'
import type {Box, WH} from '../../src/types/geo.ts'

/** https://github.com/aseprite/aseprite/blob/master/docs/ase-file-specs.md */
export type Aseprite = {meta: AsepriteMeta; frames: AsepriteFrameMap}

export type AsepriteFrameMap = {[tag: AsepriteFrameTag]: AsepriteFrame}

export type AsepriteMeta = {
  /** `--list-tags`. */
  frameTags: AsepriteTagSpan[]
  size: WH
  /** `--list-slices`. */
  slices: AsepriteSlice[]
}

/** `--filename-format='{title}--{tag}--{frame}'`. */
export type AsepriteFrameTag = `${TagFormat}--${bigint}`

export type AsepriteFrame = {
  /** positive animation length in milliseconds. */
  duration: number
  /** bounds including padding. */
  frame: Box
  /** WH without padding. */
  sourceSize: WH
}

export type AsepriteTagSpan = {
  direction: AsepriteDirection | string
  name: TagFormat | string
  from: number
  /** inclusive ending index, possibly equal to from. */
  to: number
}

export type AsepriteSlice = {
  /** '#ff0000ff' is hitbox, '#00ff00ff' is hurtbox, '#0000ffff is both. */
  color: string
  name: TagFormat | string
  keys: {bounds: Box}[]
}

export type AsepriteDirection =
  (typeof AsepriteDirection)[keyof typeof AsepriteDirection]
export const AsepriteDirection = {
  /** animate from start to end; when looping, return to start. */
  Forward: 'forward',
  /** animate from end to start; when looping, return to end. */
  Reverse: 'reverse',
  /**
   * animate from start to end - 1 or start, whichever is greater; when
   * looping, change direction (initially, end to start + 1 or end, whichever
   * is lesser. a traversal from start to end - 1 then end to start + 1 is
   * considered a complete loop.
   */
  PingPong: 'pingpong',
  /** like pingpong but start from end - 1 or start, whichever is greater. */
  PingPongReverse: 'pingpong_reverse'
} as const
