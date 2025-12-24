import type {Void} from '../void.ts'
import type {QueryEnt} from './ent-query.ts'
import type {Sys} from './sys.ts'

export type FPSEnt = QueryEnt<FPSSys['query']>

export class FPSSys implements Sys {
  readonly query = 'fps & text' as const

  update(ent: FPSEnt, _v: Void): void {
    const now = performance.now()
    if (now - ent.fps.next.created >= 1000) {
      ent.fps.prevFrames = ent.fps.next.frames
      ent.fps.next = {created: now, frames: 0}
    }
    ent.fps.next.frames++
    ent.text = ent.fps.prevFrames.toString().padStart(3, ' ')
    ent.invalid = true
  }
}
