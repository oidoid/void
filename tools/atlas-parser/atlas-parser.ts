import {
  type Anim,
  type Atlas,
  animCels,
  animMillis,
  celMillis,
  type TagFormat
} from '../../src/graphics/atlas.ts'
import {type Box, boxEq, type XY} from '../../src/types/geo.ts'
import type {
  Aseprite,
  AsepriteDirection,
  AsepriteFrame,
  AsepriteFrameMap,
  AsepriteFrameTag,
  AsepriteSlice,
  AsepriteTagSpan
} from './aseprite.ts'

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

/** @internal */
export function* parseAnimFrames(
  span: AsepriteTagSpan,
  map: AsepriteFrameMap
): IterableIterator<
  AsepriteFrame,
  // biome-ignore lint/suspicious/noConfusingVoidType:;
  AsepriteFrame | void
> {
  let cels = 0
  let animDuration = 0
  const len = span.to - span.from + 1
  const peak = len - 1
  const cycle = Math.max(1, 2 * peak)
  const indexByDir: {[dir in AsepriteDirection]: (i: number) => number} = {
    forward: i => span.from + (i % len),
    pingpong: i => span.from + peak - Math.abs((i % cycle) - peak),
    pingpong_reverse: i => span.to - (peak - Math.abs((i % cycle) - peak)),
    reverse: i => span.to - (i % len)
  }
  const frameIndex = indexByDir[span.direction as AsepriteDirection]
  for (let i = 0; cels < animCels && animDuration < animMillis; i++) {
    const frameTag = `${span.name}--${frameIndex(i)}` as AsepriteFrameTag
    const frame = map[frameTag]
    if (!frame) throw Error(`no atlas frame "${frameTag}"`)
    for (
      let celDuration = 0;
      celDuration < frame.duration &&
      cels < animCels &&
      animDuration < animMillis;
      celDuration += celMillis, animDuration += celMillis, cels++
    )
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
