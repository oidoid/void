import * as V from '../../index.ts'
import type {Game} from '../game.ts'

export class ClockEnt implements V.Ent {
  readonly #time: V.TextEnt = new V.TextEnt()

  constructor() {
    this.#time.scale = 3
    this.#time.z = V.Layer.A
  }

  free(v: Game): void {
    this.#time.free(v)
  }

  update(v: Game): boolean | undefined {
    const now = new Date()
    this.#time.text = timeString(now)

    if (this.#time.layout(v) || v.cam.invalid)
      this.#time.xy = v.cam.follow(
        {w: this.#time.wh.w, h: this.#time.wh.h - this.#time.scaledLeading},
        this.#time.z,
        'N',
        {margin: {h: 8}}
      )

    return this.#time.update(v)
  }
}

/** @internal */
export function timeString(date: Readonly<Date>): string {
  const hh = `${date.getHours() % 12 || 12}`.padStart(2, ' ')
  const mm = `${date.getMinutes()}`.padStart(2, '0')
  const ss = `${date.getSeconds()}`.padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
