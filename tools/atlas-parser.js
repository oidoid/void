/** @import {Aseprite} from './aseprite.js' */
/** @import {AsepriteFrameTag} from './aseprite.js' */
/** @import {AsepriteFrame} from './aseprite.js' */
/** @import {AsepriteFrameMap} from './aseprite.js' */
/** @import {AsepriteSlice} from './aseprite.js' */
/** @import {AsepriteTagSpan} from './aseprite.js' */
/** @import {Anim} from '../src/atlas/anim.js' */
/** @import {TagFormat} from '../src/atlas/anim.js' */
/** @import {Box} from '../src/types/2d.js' */
/** @import {XY} from '../src/types/2d.js' */

const maxAnimCels = 16

/**
 * @template T
 * @arg {Aseprite} ase
 * @arg {{readonly [tag: string]: null}} tags
 * @return {import('../src/atlas/atlas.js').Atlas<T>}
 */
export function parseAtlas(ase, tags) {
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

/**
 * @arg {number} id
 * @arg {AsepriteTagSpan} span
 * @arg {AsepriteFrameMap} map
 * @arg {readonly AsepriteSlice[]} slices
 * @return {Anim<TagFormat>}
 * @internal
 */
export function parseAnim(id, span, map, slices) {
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

/**
 * @arg {AsepriteTagSpan} span
 * @arg {AsepriteFrameMap} map
 * @return {IterableIterator<AsepriteFrame>}
 */
function* parseAnimFrames(span, map) {
  for (let i = span.from; i <= span.to && i - span.from < maxAnimCels; i++) {
    const frameTag = /** @type {AsepriteFrameTag} */ (`${span.name}--${i}`)
    const frame = map[frameTag]
    if (!frame) throw Error(`missing frame "${frameTag}"`)
    yield frame
  }
  // Pad remaining.
  for (let i = span.to + 1; i < span.from + maxAnimCels; i++) {
    const frameTag = /** @type {AsepriteFrameTag} */ (
      `${span.name}--${span.from + (i % (span.to + 1 - span.from))}`
    )
    const frame = map[frameTag]
    if (!frame) throw Error(`missing frame "${frameTag}"`)
    yield frame
  }
}

/**
 * @arg {AsepriteFrame} frame
 * @return {Readonly<XY>}
 * @internal
 */
export function parseCel(frame) {
  return {
    x: frame.frame.x + (frame.frame.w - frame.sourceSize.w) / 2,
    y: frame.frame.y + (frame.frame.h - frame.sourceSize.h) / 2
  }
}

/**
 * @arg {AsepriteTagSpan} span
 * @arg {readonly AsepriteSlice[]} slices
 * @return {Readonly<Box>}
 * @internal
 */
export function parseHitbox(span, slices) {
  const tagSlices = slices.filter(slice => slice.name === span.name)
  if (tagSlices.length > 1)
    throw Error(`tag "${span.name}" has multiple hitboxes`)
  const box = tagSlices[0]?.keys[0]?.bounds ?? {x: 0, y: 0, w: 0, h: 0}
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

/**
 * @arg {string} tag
 * @return {TagFormat}
 */
function parseTag(tag) {
  if (!tag.includes('--'))
    throw Error(`tag "${tag}" not in <filestem>--<animation> format`)
  return /** @type {TagFormat} */ (tag)
}
