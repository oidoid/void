import { FPS, QueryEnt, System, Text } from '@/void'

export type FPSEnt = QueryEnt<{ fps: FPS; text: Text }, typeof query>

const query = 'fps & text'

export class FPSSystem implements System<FPSEnt> {
  readonly query = query

  runEnt(ent: FPSEnt): void {
    const now = performance.now()
    if ((now - ent.fps.next.created) >= 1000) {
      ent.fps.prev = ent.fps.next.frames
      ent.fps.next = { created: now, frames: 0 }
    }
    ent.fps.next.frames++
    ent.text.str = ent.fps.prev.toString().padStart(3, '0')
  }
}
