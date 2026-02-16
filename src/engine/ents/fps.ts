import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'
import {textSetText} from './text.ts'

export type FPSEnt = HookEnt<FPSHook>

export class FPSHook implements Hook {
  readonly query = 'fps & text'

  update(ent: FPSEnt, v: Void): void {
    const now = performance.now()
    if (now - ent.fps.next.created >= 1000) {
      ent.fps.prevFrames = v.renderer.clears + 1 - ent.fps.next.startClears
      ent.fps.next = {created: now, startClears: v.renderer.clears + 1}
    }
    textSetText(ent, ent.fps.prevFrames.toString().padStart(3, ' '))
  }
}
