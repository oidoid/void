import { Uint } from '@/oidlib'
import { FPS, QueryToEnt, System, Text } from '@/void'

export type FPSEnt = QueryToEnt<{ fps: FPS; text: Text }, typeof query>

const query = 'fps & text'

export class FPSSystem implements System<FPSEnt> {
  readonly query = query

  runEnt(ent: FPSEnt): void {
    const now = performance.now()
    if ((now - ent.fps.next.created) >= 1000) {
      ent.fps.prev = ent.fps.next.frames
      ent.fps.next = { created: now, frames: Uint(0) }
    }
    ent.fps.next.frames = Uint(ent.fps.next.frames + 1)
    ent.text.str = ent.fps.prev.toString().padStart(3, '0')
  }
}
