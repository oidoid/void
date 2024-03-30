/** @typedef {import('./aseprite.js').Aseprite} Aseprite */
/** @typedef {import('./aseprite.js').AsepriteAnimTagFrame} AsepriteAnimTagFrame */
/** @typedef {import('./aseprite.js').AsepriteFrame} AsepriteFrame */
/** @typedef {import('./aseprite.js').AsepriteFrameMap} AsepriteFrameMap */
/** @typedef {import('./aseprite.js').AsepriteSlice} AsepriteSlice */
/** @typedef {import('./aseprite.js').AsepriteTagSpan} AsepriteTagSpan */
/** @typedef {import('../src/atlas/anim.js').Anim<AnimTag>} Anim */
/** @typedef {import('../src/atlas/anim.js').AnimTag} AnimTag */
/** @typedef {import('../src/atlas/atlas.js').Atlas} Atlas */
/** @typedef {import('../src/types/2d.js').Box} Box */
/** @typedef {import('../src/types/2d.js').WH} WH */
/** @typedef {import('../src/types/2d.js').XY} XY */
import {maxAnimCels} from '../src/atlas/anim.js'

/**
 * @arg {Aseprite} ase
 * @return {Atlas}
 */
export function parseAtlas(ase) {
  const atlas = new Map()
  for (const span of ase.meta.frameTags) {
    const tag = parseTag(span.name)
    if (atlas.has(tag)) throw Error(`duplicate tag "${tag}" in atlas`)
    const id = atlas.size * maxAnimCels
    atlas.set(tag, parseAnim(id, span, ase.frames, ase.meta.slices))
  }

  const extraSlices = ase.meta.slices.filter(
    slice => !atlas.has(parseTag(slice.name))
  )
  if (extraSlices.length)
    throw Error(
      `unknown hitbox tags in atlas: ${extraSlices.map(slice => slice.name).join(', ')}`
    )

  return Object.fromEntries(atlas)
}

/**
 * @arg {number} id
 * @arg {AsepriteTagSpan} span
 * @arg {AsepriteFrameMap} map
 * @arg {readonly AsepriteSlice[]} slices
 * @return {Anim}
 * @internal
 */
export function parseAnim(id, span, map, slices) {
  const frames = [...parseAnimFrames(span, map)]
  if (!frames[0]) throw Error('animation missing frames')
  return {
    id,
    w: frames[0].sourceSize.w,
    h: frames[0].sourceSize.h,
    cels: frames.map(parseCel),
    hitbox: parseHitbox(span, slices),
    tag: parseTag(span.name)
  }
}

/**
 * @arg {AsepriteTagSpan} span
 * @arg {AsepriteFrameMap} map
 * @return {IterableIterator<AsepriteFrame>}
 */
function* parseAnimFrames(span, map) {
  for (let i = span.from; i <= span.to && i - span.from < maxAnimCels; i++) {
    const animTagFrame = /** @type {AsepriteAnimTagFrame} */ (
      `${span.name}--${i}`
    )
    const frame = map[animTagFrame]
    if (!frame) throw Error(`missing frame "${animTagFrame}"`)
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
  if (tagSlices.length > 1) {
    throw Error(`tag "${span.name}" has multiple hitboxes`)
  }
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
 * @return {AnimTag}
 */
function parseTag(tag) {
  if (!tag.includes('--')) throw Error(`tag "${tag}" is malformed`)
  return /** @type {AnimTag} */ (tag)
}
