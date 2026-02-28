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
    const fps = `${ent.fps.prevFrames}`.padStart(4, ' ')
    const frame = v.metrics.prev.frame.toFixed(1).padStart(4, ' ')
    const draw = v.metrics.prev.draw.toFixed(1).padStart(4, ' ')
    textSetText(ent, `${fps}FPS ${frame}F ${draw}D`)
  }
}
