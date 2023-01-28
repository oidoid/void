import { Immutable } from '@/oidlib'
import { ECSUpdate, Sprite, System } from '@/void'

export interface RenderSet {
  readonly sprites: Sprite[]
}

export const RenderSystem: System<RenderSet> = Immutable({
  query: new Set(['sprites']),
  update(sets: Set<RenderSet>, update: ECSUpdate): void {
    let index = 0
    for (const set of sets) {
      for (const sprite of set.sprites) {
        if (!update.cam.viewport.intersects(sprite)) continue
        update.instanceBuffer.set(index, sprite, update.time)
        index++
      }
    }

    update.rendererStateMachine.render(
      update.time,
      update.cam,
      update.instanceBuffer,
    )
  },
})
