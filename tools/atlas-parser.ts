import type {Anim, Atlas} from '../src/graphics/atlas.js'
import type {TagFormat} from '../src/graphics/atlas.js'
import type {Box} from '../src/types/2d.ts'
import type {XY} from '../src/types/2d.ts'
import type {Aseprite} from './aseprite.js'
import type {AsepriteFrameTag} from './aseprite.js'
import type {AsepriteFrame} from './aseprite.js'
import type {AsepriteFrameMap} from './aseprite.js'
import type {AsepriteSlice} from './aseprite.js'
import type {AsepriteTagSpan} from './aseprite.js'

const maxAnimCels = 16

export function parseAtlas<T>(
  ase: Aseprite,
  tags: {readonly [tag: string]: null}
): Atlas<T> {
  const anims = new Map()
  const cels = []
  for (const span of ase.meta.frameTags) {
    const tag = parseTag(span.name)
    if (!(tag in tags)) throw Error(`unknown tag "${tag}"`)
    if (anims.has(tag)) throw Error(`duplicate tag "${tag}"`)
    const id = anims.size * maxAnimCels
    const anim = parseAnim(id, span, ase.frames, ase.meta.slices)
    anims.set(tag, anim)
    for (const cel of [...parseAnimFrames(span, ase.frames)].map(parseCel))
      cels.push(cel.x, cel.y, anim.w, anim.h)
  }
  for (const tag in tags)
    if (!anims.has(tag)) throw Error(`no animation with tag "${tag}"`)
  for (const slice of ase.meta.slices)
    if (!anims.has(parseTag(slice.name)))
      throw Error(`hitbox "${slice.name}" has no animation`)
  return {anim: Object.fromEntries(anims), cels}
}

/** @internal */
export function parseAnim(
  id: number,
  span: AsepriteTagSpan,
  map: AsepriteFrameMap,
  slices: readonly AsepriteSlice[]
): Anim<TagFormat> {
  const frame = parseAnimFrames(span, map).next().value
  if (!frame) throw Error('animation missing frames')
  return {
    h: frame.sourceSize.h,
    hitbox: parseHitbox(span, slices),
    id,
    tag: parseTag(span.name),
    w: frame.sourceSize.w
  }
}

function* parseAnimFrames(
  span: AsepriteTagSpan,
  map: AsepriteFrameMap
): IterableIterator<AsepriteFrame> {
  for (let i = span.from; i <= span.to && i - span.from < maxAnimCels; i++) {
    const frameTag = `${span.name}--${i}` as AsepriteFrameTag
    const frame = map[frameTag]
    if (!frame) throw Error(`no frame "${frameTag}"`)
    yield frame
  }
  // Pad remaining.
  for (let i = span.to + 1; i < span.from + maxAnimCels; i++) {
    const frameTag =
      `${span.name}--${span.from + (i % (span.to + 1 - span.from))}` as AsepriteFrameTag
    const frame = map[frameTag]
    if (!frame) throw Error(`no frame "${frameTag}"`)
    yield frame
  }
}

export function parseCel(frame: AsepriteFrame): Readonly<XY> {
  return {
    x: frame.frame.x + (frame.frame.w - frame.sourceSize.w) / 2,
    y: frame.frame.y + (frame.frame.h - frame.sourceSize.h) / 2
  }
}

/** @internal */
export function parseHitbox(
  span: AsepriteTagSpan,
  slices: readonly AsepriteSlice[]
): Readonly<Box> {
  const tagSlices = slices.filter(slice => slice.name === span.name)
  if (tagSlices.length > 1)
    throw Error(`tag "${span.name}" has multiple hitboxes`)
  const box = tagSlices[0]?.keys[0]?.bounds ?? {x: 0, y: 0, w: -1, h: -1}
  // https://github.com/aseprite/aseprite/issues/3524
  for (const key of tagSlices[0]?.keys ?? []) {
    if (
      key.bounds.x !== box.x ||
      key.bounds.y !== box.y ||
      key.bounds.w !== box.w ||
      key.bounds.h !== box.h
    )
      throw Error(`tag "${span.name}" hitbox varies across frames`)
  }
  return box
}

function parseTag(tag: string): TagFormat {
  if (!tag.includes('--'))
    throw Error(`tag "${tag}" not in <filestem>--<animation> format`)
  return tag as TagFormat
}
