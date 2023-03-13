import {
  BitmapBuffer,
  Game,
  QueryEnt,
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

  run(ents: ReadonlySet<RenderEnt>, game: Game<Ent>): void {
    let index = 0
    for (const ent of ents) {
      if ('sprites' in ent) {
        for (const sprite of ent.sprites) {
          if (!game.cam.viewport.intersects(sprite)) continue
          this.#bitmaps.set(index, sprite, game.time)
          index++
        }
      } else {
        if (!game.cam.viewport.intersects(ent.sprite)) continue
        this.#bitmaps.set(index, ent.sprite, game.time)
        index++
      }
    }

    game.renderer.render(game.time, game.cam, this.#bitmaps)
  }
}
