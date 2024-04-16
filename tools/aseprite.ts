import type {AnimTagFormat} from '../src/atlas/anim.js'
import type {Box, WH} from '../src/types/2d.js'

/** https://github.com/aseprite/aseprite/blob/master/docs/ase-file-specs.md */
export type Aseprite = {
  readonly meta: AsepriteMeta
  readonly frames: AsepriteFrameMap
}

export type AsepriteFrameMap = {
  readonly [key: AsepriteAnimTagFrame]: AsepriteFrame
}

export type AsepriteMeta = {
  /** `--list-tags`. */
  readonly frameTags: readonly AsepriteTagSpan[]
  /** `--list-slices`. */
  readonly slices: readonly AsepriteSlice[]
}

/** `--filename-format='{title}--{tag}--{frame}'`. */
export type AsepriteAnimTagFrame = `${AnimTagFormat}--${bigint}`

export type AsepriteFrame = {
  /** Bounds including padding. */
  readonly frame: Readonly<Box>
  /** WH without padding. */
  readonly sourceSize: Readonly<WH>
}

export type AsepriteTagSpan = {
  readonly name: AnimTagFormat | string
  readonly from: number
  /** The inclusive ending index, possibly equal to from. */
  readonly to: number
}

export type AsepriteSlice = {
  readonly name: AnimTagFormat | string
  readonly keys: readonly {readonly bounds: Readonly<Box>}[]
}
