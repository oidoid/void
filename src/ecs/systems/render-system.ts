import {
  BitmapBuffer,
  QueryEnt,
  RunState,
  ShaderLayout,
  Sprite,
  System,
} from '@/void'

export type RenderEnt = QueryEnt<
  { sprite: Sprite; sprites: Sprite[] },
  typeof query
>

const query = 'sprite | sprites'

export class RenderSystem<Ent extends RenderEnt>
  implements System<RenderEnt, Ent> {
  readonly query = query
  readonly #bitmaps: BitmapBuffer

  constructor(layout: ShaderLayout) {
    this.#bitmaps = new BitmapBuffer(layout)
  }

  run(ents: ReadonlySet<RenderEnt>, state: RunState<Ent>): void {
    let index = 0
    for (const ent of ents) {
      if ('sprites' in ent) {
        for (const sprite of ent.sprites) {
          if (!state.cam.viewport.intersects(sprite)) continue
          this.#bitmaps.set(index, sprite, state.time)
          index++
        }
      } else {
        if (!state.cam.viewport.intersects(ent.sprite)) continue
        this.#bitmaps.set(index, ent.sprite, state.time)
        index++
      }
    }

    state.renderer.render(state.time, state.cam, this.#bitmaps)
  }
}
