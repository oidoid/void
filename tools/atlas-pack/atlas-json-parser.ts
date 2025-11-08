import * as V from '../../src/index.ts'
import {
  type Aseprite,
  AsepriteDirection,
  type AsepriteFrame,
  type AsepriteFrameMap,
  type AsepriteFrameTag,
  type AsepriteSlice,
  type AsepriteTagSpan
} from './aseprite.ts'

export function parseAtlasJSON(json: Readonly<V.JSONObject>): V.AtlasJSON {
  const ase = json as Readonly<Aseprite>
  const anim: {[tag: string]: V.Anim} = {}
  const cels: number[] = []
  for (const span of ase.meta.frameTags) {
    const tag = parseTag(span.name)
    if (anim[tag]) throw Error(`atlas tag "${tag}" duplicate`)
    const id = Object.keys(anim).length
    anim[tag] = parseAnim(id, span, ase.frames, ase.meta.slices)
    for (const cel of parseAnimFrames(span, ase.frames).map(parseCel))
      cels.push(cel.x, cel.y)
  }
  for (const slice of ase.meta.slices)
    if (!anim[parseTag(slice.name)])
      throw Error(`atlas hitbox "${slice.name}" has no animation`)
  return {anim, celXY: cels}
}

/** @internal */
export function parseAnim(
  id: number,
  span: Readonly<AsepriteTagSpan>,
  map: Readonly<AsepriteFrameMap>,
  slices: readonly Readonly<AsepriteSlice>[]
): V.Anim {
  const cels = parseAnimFrames(span, map)
  if (!cels[0]) throw Error(`no atlas frame "${span.name}"`)
  const {hitbox, hurtbox} = parseHitboxes(span, slices)
  return {
    cels: cels.length,
    h: cels[0].sourceSize.h,
    hitbox,
    hurtbox,
    id,
    w: cels[0].sourceSize.w
  }
}

/**
 * every frame is guaranteed to be present for at least `celMillis`. cels are
 * duplicated until cel duration is at least met. cels are unpacked until a full
 * period is defined for the direction. no warns for overflowing past on second
 * or uneven periods.
 * @internal
 */
export function parseAnimFrames(
  span: AsepriteTagSpan,
  map: AsepriteFrameMap
): AsepriteFrame[] {
  const cels = []
  let animDuration = 0
  const len = span.to - span.from + 1
  const peak = len - 1
  const cycle = Math.max(1, 2 * peak)
  const end =
    span.direction === AsepriteDirection.Forward ||
    span.direction === AsepriteDirection.Reverse
      ? len
      : cycle
  const indexByDir: {[dir in AsepriteDirection]: (i: number) => number} = {
    forward: i => span.from + (i % len),
    pingpong: i => span.from + peak - Math.abs((i % cycle) - peak),
    pingpong_reverse: i => span.to - (peak - Math.abs((i % cycle) - peak)),
    reverse: i => span.to - (i % len)
  }
  const frameIndex = indexByDir[span.direction as AsepriteDirection]
  for (
    let i = 0;
    i < end && cels.length < V.animCels && animDuration < V.animMillis;
    i++
  ) {
    const frameTag = `${span.name}--${frameIndex(i)}` as AsepriteFrameTag
    const frame = map[frameTag]
    if (!frame) throw Error(`no atlas frame "${frameTag}"`)
    for (
      let celDuration = 0;
      celDuration < frame.duration &&
      cels.length < V.animCels &&
      animDuration < V.animMillis;
      celDuration += V.celMillis, animDuration += V.celMillis
    ) {
      cels.push(frame)

      if (span.from === span.to) return cels // optimize for long single cel.
    }
  }
  return cels
}

/** @internal */
export function parseCel(frame: Readonly<AsepriteFrame>): V.XY {
  return {
    x: frame.frame.x + (frame.frame.w - frame.sourceSize.w) / 2,
    y: frame.frame.y + (frame.frame.h - frame.sourceSize.h) / 2
  }
}

/** @internal */
export function parseHitboxes(
  span: Readonly<AsepriteTagSpan>,
  slices: readonly Readonly<AsepriteSlice>[]
): {hitbox: V.Box | undefined; hurtbox: V.Box | undefined} {
  let hitbox
  let hurtbox
  // https://github.com/aseprite/aseprite/issues/3524
  for (const slice of slices) {
    if (slice.name !== span.name) continue

    if (!slice.keys[0]) continue

    for (const k of slice.keys)
      if (!V.boxEq(k.bounds, slice.keys[0].bounds))
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

function parseTag(tag: string): V.TagFormat {
  if (!tag.includes('--'))
    throw Error(`atlas tag "${tag}" not in <filestem>--<animation> format`)
  return tag as V.TagFormat
}
