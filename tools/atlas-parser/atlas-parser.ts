import {
  type Anim,
  type Atlas,
  maxAnimCels,
  type TagFormat
} from '../../src/graphics/atlas.ts'
import {type Box, boxEq, type XY} from '../../src/types/geo.ts'
import type {
  Aseprite,
  AsepriteFrame,
  AsepriteFrameMap,
  AsepriteFrameTag,
  AsepriteSlice,
  AsepriteTagSpan
} from './aseprite.js'

export function parseAtlas(ase: Aseprite): Atlas {
  const anim: {[tag: string]: Anim} = {}
  const cels: number[] = []
  for (const span of ase.meta.frameTags) {
    const tag = parseTag(span.name)
    if (anim[tag]) throw Error(`atlas tag "${tag}" duplicate`)
    const id = Object.keys(anim).length
    anim[tag] = parseAnim(id, span, ase.frames, ase.meta.slices)
    for (const cel of [...parseAnimFrames(span, ase.frames)].map(parseCel))
      cels.push(cel.x, cel.y, anim[tag].w, anim[tag].h)
  }
  for (const slice of ase.meta.slices)
    if (!anim[parseTag(slice.name)])
      throw Error(`atlas hitbox "${slice.name}" has no animation`)
  return {anim, cels, tags: Object.keys(anim)}
}

/** @internal */
export function parseAnim(
  id: number,
  span: AsepriteTagSpan,
  map: AsepriteFrameMap,
  slices: readonly AsepriteSlice[]
): Anim {
  const frame = parseAnimFrames(span, map).next().value
  if (!frame) throw Error(`no atlas frame "${span.name}"`)
  const {hitbox, hurtbox} = parseHitboxes(span, slices)
  return {
    cels: span.to - span.from + 1,
    h: frame.sourceSize.h,
    hitbox,
    hurtbox,
    id,
    w: frame.sourceSize.w
  }
}

function* parseAnimFrames(
  span: AsepriteTagSpan,
  map: AsepriteFrameMap
): IterableIterator<
  AsepriteFrame,
  // biome-ignore lint/suspicious/noConfusingVoidType:;
  AsepriteFrame | void
> {
  for (let i = span.from; i <= span.to && i - span.from < maxAnimCels; i++) {
    const frameTag = `${span.name}--${i}` as AsepriteFrameTag
    const frame = map[frameTag]
    if (!frame) throw Error(`no atlas frame "${frameTag}"`)
    yield frame
  }
  // pad remaining by looping back.
  for (let i = span.to + 1; i < span.from + maxAnimCels; i++) {
    const frameTag = `${span.name}--${
      span.from + (i % (span.to + 1 - span.from))
    }` as AsepriteFrameTag
    const frame = map[frameTag]
    if (!frame) throw Error(`no atlas frame "${frameTag}"`)
    yield frame
  }
}

/** @internal */
export function parseCel(frame: AsepriteFrame): XY {
  return {
    x: frame.frame.x + (frame.frame.w - frame.sourceSize.w) / 2,
    y: frame.frame.y + (frame.frame.h - frame.sourceSize.h) / 2
  }
}

/** @internal */
export function parseHitboxes(
  span: AsepriteTagSpan,
  slices: readonly AsepriteSlice[]
): {hitbox: Box | undefined; hurtbox: Box | undefined} {
  let hitbox
  let hurtbox
  // https://github.com/aseprite/aseprite/issues/3524
  for (const slice of slices) {
    if (slice.name !== span.name) continue

    if (!slice.keys[0]) continue

    for (const k of slice.keys)
      if (!boxEq(k.bounds, slice.keys[0].bounds))
        throw Error(
          `atlas tag "${span.name}" hitbox bounds varies across frames`
        )

    const red = slice.color === '#ff0000ff'
    const green = slice.color === '#00ff00ff'
    const blue = slice.color === '#0000ffff' // default Aseprite slice color.
    if (!red && !green && !blue)
      throw Error(
        `atlas tag "${span.name}" hitbox color ${slice.color} unsupported`
      )

    if (hitbox && (red || blue))
      throw Error(`atlas tag "${span.name}" has multiple hitboxes`)

    if (hurtbox && (green || blue))
      throw Error(`atlas tag "${span.name}" has multiple hurtboxes`)

    if (red || blue) hitbox = slice.keys[0].bounds
    if (green || blue) hurtbox = slice.keys[0].bounds
  }
  return {hitbox, hurtbox}
}

function parseTag(tag: string): TagFormat {
  if (!tag.includes('--'))
    throw Error(`atlas tag "${tag}" not in <filestem>--<animation> format`)
  return tag as TagFormat
}
