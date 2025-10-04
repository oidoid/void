import {type Ent, Layer, TextEnt} from '../../index.ts'
import type {Game} from '../game.ts'

export class ClockEnt implements Ent {
  readonly #time: TextEnt = new TextEnt()

  constructor() {
    this.#time.scale = 3
    this.#time.z = Layer.A
  }

  free(v: Game): void {
    this.#time.free(v)
  }

  update(v: Game): boolean | undefined {
    this.#time.text = timeString(new Date())
    let render = this.#time.update(v)

    if (v.cam.invalid || render)
      this.#time.xy = v.cam.follow(
        {w: this.#time.wh.w, h: this.#time.wh.h - this.#time.scaledLeading},
        this.#time.z,
        'N',
        {margin: {h: 8}}
      )

    if (this.#time.update(v)) render = true

    return render
  }
}

function timeString(date: Readonly<Date>): string {
  const hh = `${date.getHours() % 12 || 12}`.padStart(2, ' ')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  const ss = `${date.getSeconds()}`.padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
