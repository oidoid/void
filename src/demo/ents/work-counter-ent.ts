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

  // to-do: rename.
  record(v: Game, op: 'Render' | 'Update'): void {
    if (op === 'Render') this.#renders++
    this.#text.text = `${this.#updates} updates\n${this.#renders} renders`
    this.#text.xy = v.cam.follow(
      {w: this.#text.wh.w, h: this.#text.wh.h - this.#text.scaledLeading},
      this.#text.z,
      'NE',
      {pad: {w: 8, h: 8}} //to-do: old opts parser allowed passing number for both w and h.
    )
    // to-do: fix double layout nad update call. this is for move
    this.#text.update(v) // to-do: only want one update.
  }

  /** always updates but never invalidates. */
  update(): undefined {
    this.#updates++
  }
}
