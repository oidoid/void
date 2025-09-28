import type {TagFormat} from '../graphics/atlas.ts'
import type {Void} from '../void.ts'
import {CursorEnt} from './cursor-ent.ts'
import type {Ent} from './ent.ts'

/**
 * ents are updated in insertion order. composed ents are updated by their
 * owning ents.
 */
// to-do: layer ents by update order.
export class Zoo<out Tag extends TagFormat> {
  #cursor: CursorEnt<Tag> | undefined
  readonly #ents: Set<Ent> = new Set()

  add(...ents: readonly Ent[]): void {
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

  remove(...ents: readonly Readonly<Ent>[]): void {
    for (const ent of ents) {
      this.#ents.delete(ent)
      if (ent === this.#cursor) this.#cursor = undefined
    }
  }

  update(v: Void<TagFormat, string>): boolean {
    let invalid = false
    for (const ent of this.#ents) if (ent.update?.(v)) invalid = true
    return invalid
  }
}
