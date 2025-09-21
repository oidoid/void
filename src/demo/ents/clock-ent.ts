import {type Ent, Layer, TextEnt, type Void} from '../../index.ts'

export class ClockEnt implements Ent {
  readonly #time: TextEnt = new TextEnt()

  constructor() {
    this.#time.scale = 3
    this.#time.z = Layer.A
  }

  update(v: Void): boolean | undefined {
    this.#time.text = timeString(new Date())
    let render = this.#time.update(v)

    if (v.cam.invalid || render)
      this.#time.xy = v.cam.follow(this.#time.wh, this.#time.z, 'N', {
        pad: {h: 8}
      })

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
