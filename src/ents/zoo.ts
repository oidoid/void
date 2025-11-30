import type {AnyTag} from '../graphics/atlas.ts'
import {debug} from '../utils/debug.ts'
import type {Void} from '../void.ts'
import {CursorEnt} from './cursor.ts'
import type {Ent} from './ent.ts'

/**
 * ents are updated in insertion order. composed ents are updated by their
 * owning ents.
 */
export class Zoo<Tag extends AnyTag> {
  #cursor: CursorEnt<Tag> | undefined
  readonly #ents: Set<Ent<Tag>> = new Set()
  #invalid: boolean = false

  add(...ents: readonly Ent<Tag>[]): void {
    for (const ent of ents) {
      this.#ents.add(ent)
      if (ent instanceof CursorEnt) this.#cursor = ent
    }
  }

  clear(): void {
    this.#cursor = undefined
    this.#ents.clear()
  }

  get cursor(): CursorEnt<Tag> | undefined {
    return this.#cursor
  }

  get invalid(): boolean {
    return this.#invalid
  }

  remove(...ents: readonly Readonly<Ent<Tag>>[]): void {
    for (const ent of ents) {
      this.#ents.delete(ent)
      if (ent === this.#cursor) this.#cursor = undefined
    }
  }

  update(v: Void<Tag, string>): void {
    this.#invalid = false
    for (const ent of this.#ents)
      if (ent.update?.(v)) {
        if (!this.#invalid && debug?.invalid)
          console.debug('ent update invalid', ent)
        this.#invalid = true
      }
  }
}
