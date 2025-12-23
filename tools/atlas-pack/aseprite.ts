import type * as V from '../../src/index.ts'

/** https://github.com/aseprite/aseprite/blob/master/docs/ase-file-specs.md */
export type Aseprite = {meta: Meta; frames: FrameMap}

/** eg, `#000000ff`. */
export type Color = `#${string}`

export type FrameMap = {[tag: FrameTag]: Frame}

export type Key = {
  /** slice dimensions. */
  bounds: V.Box
  /** inclusive `Frame` start offset. */
  frame: number
}

export type Meta = {
  /** e.g., `http://www.aseprite.org/`. */
  app: string
  /** e.g., `1.3.15.4-x64`. */
  version: string
  /** output basename. e.g., `atlas.png`. */
  image: string
  /** e.g., `RGBA8888` or `I8`. */
  format: string
  /** output dimensions (`--sheet-pack`). */
  size: V.WH
  /** e.g., `1`. */
  scale: string
  /** all `TagSpan`s for all files packed (`--list-tags`). */
  frameTags: TagSpan[]
  /** all slices for all files packed (`--list-slices`). */
  slices: Slice[]
}

/** `--filename-format='{title}--{tag}--{frame}'`. */
export type FrameTag = `${V.AnimTag}--${bigint}`

/** a cel. */
export type Frame = {
  /** animation length in milliseconds. */
  duration: number
  /** bounds including padding (`--inner-padding=n`). */
  frame: V.Box
  rotated: boolean
  trimmed: boolean
  /** bounds not including padding. x and y are always zero. */
  spriteSourceSize: V.Box
  /** WH without padding. */
  sourceSize: V.WH
}

export type Slice = {
  /** `#ff0000ff` is hitbox, `#00ff00ff` is hurtbox, `#0000ffff` is both. */
  color: Color
  name: V.AnimTag
  keys: Key[]
}

/** a label and animation behavior. references `Frame`s to form an animation. */
export type TagSpan = {
  color: Color
  name: V.AnimTag
  /** inclusive starting Frame index. */
  from: number
  /** inclusive ending index, possibly equal to from. */
  to: number
  direction: Direction
  /** number of times to replay the animation. undefined is infinite. */
  repeat?: `${bigint}`
}

export type Direction = (typeof Direction)[keyof typeof Direction]
export const Direction = {
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
