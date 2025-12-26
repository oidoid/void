import type {Sys, SysEnt} from './sys.ts'

export type FPSEnt = SysEnt<FPSSys>

export class FPSSys implements Sys {
  readonly query = 'fps & text'

  update(ent: FPSEnt): void {
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
