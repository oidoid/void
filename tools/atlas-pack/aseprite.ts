import type * as V from '../../src/index.ts'

/** https://github.com/aseprite/aseprite/blob/master/docs/ase-file-specs.md */
export type Aseprite = {meta: AsepriteMeta; frames: AsepriteFrameMap}

export type AsepriteFrameMap = {[tag: AsepriteFrameTag]: AsepriteFrame}

export type AsepriteMeta = {
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
  /** all `AsepriteTagSpan`s for all files packed (`--list-tags`). */
  frameTags: AsepriteTagSpan[]
  /** all slices for all files packed (`--list-slices`). */
  slices: AsepriteSlice[]
}

/** `--filename-format='{title}--{tag}--{frame}'`. */
export type AsepriteFrameTag = `${V.TagFormat}--${bigint}`

/** a cel. */
export type AsepriteFrame = {
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

/**
 * a label and animation behavior. references `AsepriteFrame`s to form an
 * animation.
 */
export type AsepriteTagSpan = {
  /** eg, `#000000ff`. */
  color: string
  name: V.TagFormat
  /** inclusive starting Frame index. */
  from: number
  /** inclusive ending index, possibly equal to from. */
  to: number
  direction: AsepriteDirection | string
  /** number of times to replay the animation. */
  repeat?: `${bigint}` | string
}

export type AsepriteSlice = {
  /** `#ff0000ff` is hitbox, `#00ff00ff` is hurtbox, `#0000ffff` is both. */
  color: string
  name: V.TagFormat
  keys: AsepriteKey[]
}

export type AsepriteKey = {
  /** slice dimensions. */
  bounds: V.Box
  /** inclusive `AsepriteFrame` start offset. */
  frame: number
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
