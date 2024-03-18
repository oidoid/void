import { Box, WH, XY } from '../types/2d.ts'
import {
  AnimTag,
  Aseprite,
  AsepriteAnimTagFrame,
  AsepriteFrame,
  AsepriteFrameMap,
  AsepriteSlice,
  AsepriteTagSpan,
} from './aseprite.ts'

export type Atlas<T extends AnimTag = AnimTag> = {
  readonly [tag in T]: Anim<T>
}
export type Anim<T extends AnimTag = AnimTag> = {
  readonly cels: readonly Readonly<XY>[]
  readonly hitbox: Readonly<Box>
  /** A multiple of 16 (maxAnimCels). */
  readonly id: number
  readonly tag: T
} & Readonly<WH>

export const maxAnimCels = 16

export function parseAtlas(ase: Aseprite): Atlas {
  const atlas = new Map<AnimTag, Anim>()
  for (const span of ase.meta.frameTags) {
    const tag = parseTag(span.name)
    if (atlas.has(tag)) throw Error(`duplicate tag "${tag}" in atlas`)
    const id = atlas.size * maxAnimCels
    atlas.set(tag, parseAnim(id, span, ase.frames, ase.meta.slices))
  }

  const extraSlices = ase.meta.slices.filter((slice) =>
    !atlas.has(parseTag(slice.name))
  )
  if (extraSlices.length) {
    throw Error(
      'unknown hitbox tags in atlas: ' +
        `${extraSlices.map((slice) => slice.name).join(', ')}`,
    )
  }

  return Object.fromEntries(atlas)
}

/** @internal */
export function parseAnim(
  id: number,
  span: AsepriteTagSpan,
  map: AsepriteFrameMap,
  slices: readonly AsepriteSlice[],
): Anim {
  const frames = [...parseAnimFrames(span, map)]
  return {
    id,
    w: frames[0]!.sourceSize.w,
    h: frames[0]!.sourceSize.h,
    cels: frames.map(parseCel),
    hitbox: parseHitbox(span, slices),
    tag: parseTag(span.name),
  }
}

function* parseAnimFrames(
  span: AsepriteTagSpan,
  map: AsepriteFrameMap,
): IterableIterator<AsepriteFrame> {
  for (let i = span.from; i <= span.to && (i - span.from) < maxAnimCels; i++) {
    const animTagFrame = `${span.name}--${i}` as AsepriteAnimTagFrame
    const frame = map[animTagFrame]
    if (!frame) throw Error(`missing frame "${animTagFrame}"`)
    yield frame
  }
}

/** @internal */
export function parseCel(frame: AsepriteFrame): Readonly<XY> {
  return {
    x: frame.frame.x + (frame.frame.w - frame.sourceSize.w) / 2,
    y: frame.frame.y + (frame.frame.h - frame.sourceSize.h) / 2,
  }
}

/** @internal */
export function parseHitbox(
  span: AsepriteTagSpan,
  slices: readonly AsepriteSlice[],
): Readonly<Box> {
  const tagSlices = slices.filter((slice) => slice.name === span.name)
  if (tagSlices.length > 1) {
    throw Error(`tag "${span.name}" has multiple hitboxes`)
  }
  const box = tagSlices[0]?.keys[0]?.bounds ?? { x: 0, y: 0, w: 0, h: 0 }
  // https://github.com/aseprite/aseprite/issues/3524
  for (const key of tagSlices[0]?.keys ?? []) {
    if (
      key.bounds.x !== box.x || key.bounds.y !== box.y ||
      key.bounds.w !== box.w || key.bounds.h !== box.h
    ) throw Error(`tag "${span.name}" hitbox varies across frames`)
  }
  return box
}

function parseTag(tag: string): AnimTag {
  if (!tag.includes('--')) throw Error(`tag "${tag}" is malformed`)
  return tag as AnimTag
}
