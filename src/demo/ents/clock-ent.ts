import {type Ent, TextEnt, type Void} from '../../index.ts'
import type {Tag} from '../tag.ts'

export class ClockEnt implements Ent {
  readonly #textEnt: TextEnt<Tag> = new TextEnt()

  constructor() {
    this.#textEnt.scale = 12
    this.#textEnt.xy = {x: 0, y: 200}
  }

  update(v: Void): boolean | undefined {
    const now = new Date()
    const hours = `${now.getHours() % 12 || 12}`.padStart(2, ' ')
    const mins = `${now.getMinutes()}`.padStart(2, '0')
    const secs = `${now.getSeconds()}`.padStart(2, '0')
    this.#textEnt.text = `${hours}:${mins}:${secs}`
    return this.#textEnt.update(v)
  }
}
