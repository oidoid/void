import {type Ent, Layer, TextEnt} from '../../index.ts'
import type {Game} from '../game.ts'

export class WorkCounterEnt implements Ent {
  #renders: number = 0
  #updates: number = 0
  readonly #text: TextEnt = new TextEnt()

  constructor() {
    this.#text.z = Layer.A
  }

  free(v: Game): void {
    this.#text.free(v)
  }

  incrementRender(): void {
    this.#renders++
  }

  /** always updates but never invalidates. */
  update(v: Game): undefined {
    this.#updates++
    this.#text.text = `${this.#updates} updates\n${this.#renders + 1} renders`
    this.#text.layout(v)
    this.#text.xy = v.cam.follow(
      {w: this.#text.wh.w, h: this.#text.wh.h - this.#text.scaledLeading},
      this.#text.z,
      'NE',
      {margin: {w: 8, h: 8}} //to-do: old opts parser allowed passing number for both w and h.
    )
    this.#text.update(v)
  }
}
