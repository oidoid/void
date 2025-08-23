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
  /** bounds including padding. */
  frame: Box
  /** WH without padding. */
  sourceSize: WH
}

export type AsepriteTagSpan = {
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
