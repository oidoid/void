import {type Ent, Layer, TextEnt} from '../../index.ts'
import type {Game} from '../game.ts'

export class FrameCounterEnt implements Ent {
  #count: number = 0
  readonly #text: TextEnt = new TextEnt()

  constructor() {
    this.#text.z = Layer.A
  }

  free(v: Game): void {
    this.#text.free(v)
  }

  /** always updates but never invalidates. */
  update(v: Game): boolean | undefined {
    this.#text.text = `ups ${this.#count}`

    this.#text.update(v)
    this.#text.xy = v.cam.follow(
      {w: this.#text.wh.w, h: this.#text.wh.h - this.#text.scaledLeading},
      this.#text.z,
      'NE',
      {pad: {w: 8, h: 8}} //to-do: old opts parser allowed passing number for both w and h.
    )
    this.#text.update(v) // to-do: only want one update.

    this.#count++
    return
  }
}
