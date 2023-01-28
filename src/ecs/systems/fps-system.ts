import { Uint } from '@/oidlib'
import { ECSUpdate, FPS, System, Text } from '@/void'

export interface FPSSet {
  fps: FPS
  text: Text
}

export class FPSSystem implements System<FPSSet, ECSUpdate> {
  query = new Set(['fps', 'text'] as const)

  updateEnt(set: FPSSet): void {
    const now = performance.now()
    if ((now - set.fps.next.created) >= 1000) {
      set.fps.prev = set.fps.next.frames
      set.fps.next = { created: now, frames: Uint(0) }
    }
    set.fps.next.frames = Uint(set.fps.next.frames + 1)
    set.text.str = set.fps.prev.toString().padStart(3, '0')
  }
}
