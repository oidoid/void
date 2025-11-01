import type {AtlasJSON} from '../types/game-config.ts'
import {type Anim, type Atlas, animCels, type TagFormat} from './atlas.ts'

export function parseAtlas<Tag extends TagFormat>(
  json: Readonly<AtlasJSON>
): Atlas<Tag> {
  return {
    anim: json.anim as {[tag in Tag]: Anim},
    celXYWH: parseCelXYWH(json),
    tags: Object.keys(json.anim) as Tag[]
  }
}

function parseCelXYWH(json: Readonly<AtlasJSON>): number[] {
  const cels = []
  let i = 0
  for (const anim of Object.values(json.anim)) {
    cels.push(...parseXYWH(anim, json.celXY, i))
    i += anim.cels * 2
  }
  return cels
}

/** @internal */
export function parseXYWH(
  anim: Readonly<Anim>,
  celXY: readonly number[],
  i: number
): number[] {
  const xywh = []
  for (let ii = 0; ii < animCels; ii++) {
    const iii = i + 2 * (ii % anim.cels)
    xywh.push(celXY[iii]!, celXY[iii + 1]!, anim.w, anim.h)
  }
  return xywh
}
