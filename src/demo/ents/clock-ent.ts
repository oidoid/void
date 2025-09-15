import {type Ent, Layer, TextEnt, type Void} from '../../index.ts'

export class ClockEnt implements Ent {
  readonly #textEnt: TextEnt = new TextEnt()

  constructor() {
    this.#textEnt.scale = 3
    this.#textEnt.xy = {x: 16, y: 200}
    this.#textEnt.z = Layer.A
  }

  update(v: Void): boolean | undefined {
    const now = new Date()
    const hours = `${now.getHours() % 12 || 12}`.padStart(2, ' ')
    const mins = `${now.getMinutes()}`.padStart(2, '0')
    const secs = `${now.getSeconds()}`.padStart(2, '0')
    this.#textEnt.text = `${hours}:${mins}:${secs}`

    // to-do: expose pivot, layer
    const box = v.cam.follow(this.#textEnt.wh, this.#textEnt.z, 'N', {
      pad: {h: 32}
    })
    this.#textEnt.xy = box

    return this.#textEnt.update(v)
  }
}
