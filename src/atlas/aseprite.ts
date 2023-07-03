import { Box, WH } from '../types/2d.ts'

/** https://github.com/aseprite/aseprite/blob/master/docs/ase-file-specs.md */
export type Aseprite = Readonly<{
  meta: AsepriteMeta
  frames: AsepriteFrameMap
}>

export type AsepriteFrameMap = Readonly<
  Record<AsepriteAnimTagFrame, AsepriteFrame>
>

export type AsepriteMeta = Readonly<{
  /** `--list-tags`. */
  frameTags: readonly AsepriteTagSpan[]
  /** `--list-slices`. */
  slices: readonly AsepriteSlice[]
}>

/** `--filename-format='{title}--{tag}--{frame}'`. */
export type AsepriteAnimTagFrame = `${AnimTag}--${bigint}`

/** `--tagname-format={title}--{tag}`. */
export type AnimTag = `${string}--${string}`

export type AsepriteFrame = Readonly<{
  /** Bounds including padding. */
  frame: Readonly<Box>
  /** WH without padding. */
  sourceSize: Readonly<WH>
}>

export type AsepriteTagSpan = Readonly<{
  name: AnimTag | string
  from: number
  /** The inclusive ending index, possibly equal to from. */
  to: number
}>

export type AsepriteSlice = Readonly<{
  name: AnimTag | string
  keys: readonly { readonly bounds: Readonly<Box> }[]
}>
