import * as V from '../../index.ts'
import type {Game} from '../game.ts'
import type {Tag} from '../types/tag.ts'

export class WorkCounterEnt implements V.Ent<Tag> {
  readonly #text: V.TextEnt = new V.TextEnt()
  #updates: number = 0

  constructor() {
    this.#text.z = V.Layer.A
  }

  free(v: Game): void {
    this.#text.free(v)
  }

  /** always updates but never invalidates. */
  update(v: Game): undefined {
    this.#updates++
    this.#text.text = `${`${this.#updates}`.padStart(8, ' ')} updates\n${`${v.renderer.clears + 1}`.padStart(8, ' ')} renders`
    this.#text.layout(v)
    this.#text.xy = v.cam.follow(
      {w: this.#text.wh.w, h: this.#text.wh.h - this.#text.scaledLeading},
      this.#text.z,
      'NE',
      {margin: {w: 8, h: 8}}
    )
    this.#text.update(v)
  }
}
