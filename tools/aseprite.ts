import type {TagFormat} from '../src/graphics/atlas.js'
import type {Box, WH} from '../src/types/2d.js'

/** https://github.com/aseprite/aseprite/blob/master/docs/ase-file-specs.md */
export type Aseprite = {
  readonly meta: AsepriteMeta
  readonly frames: AsepriteFrameMap
}

export type AsepriteFrameMap = {
  readonly [key: AsepriteFrameTag]: AsepriteFrame
}

export type AsepriteMeta = {
  /** `--list-tags`. */
  readonly frameTags: readonly AsepriteTagSpan[]
  readonly size: Readonly<WH>
  /** `--list-slices`. */
  readonly slices: readonly AsepriteSlice[]
}

/** `--filename-format='{title}--{tag}--{frame}'`. */
export type AsepriteFrameTag = `${TagFormat}--${bigint}`

export type AsepriteFrame = {
  /** bounds including padding. */
  readonly frame: Readonly<Box>
  /** WH without padding. */
  readonly sourceSize: Readonly<WH>
}

export type AsepriteTagSpan = {
  readonly name: TagFormat | string
  readonly from: number
  /** the inclusive ending index, possibly equal to from. */
  readonly to: number
}

export type AsepriteSlice = {
  readonly name: TagFormat | string
  readonly keys: readonly {readonly bounds: Readonly<Box>}[]
}
