import { QueryToEnt, RunState, Sprite, System } from '@/void'

export type RenderEnt = QueryToEnt<
  { sprite: Sprite; sprites: Sprite[] },
  typeof query
>

const query = 'sprite | sprites'

export class RenderSystem implements System<RenderEnt> {
  readonly query = query
  run(ents: ReadonlySet<RenderEnt>, state: RunState<RenderEnt>): void {
    let index = 0
    for (const ent of ents) {
      if ('sprites' in ent) {
        for (const sprite of ent.sprites) {
          if (!state.cam.viewport.intersects(sprite)) continue
          state.instanceBuffer.set(index, sprite, state.time)
          index++
        }
      } else {
        if (!state.cam.viewport.intersects(ent.sprite)) continue
        state.instanceBuffer.set(index, ent.sprite, state.time)
        index++
      }
    }

    state.rendererStateMachine.render(
      state.time,
      state.cam,
      state.instanceBuffer,
    )
  }
}
