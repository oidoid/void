import type {AnyTag} from '../graphics/atlas.ts'
import {debug} from '../utils/debug.ts'
import type {Void} from '../void.ts'
import {ButtonSys} from './button.ts'
import {type CursorEnt, CursorSys} from './cursor.ts'
import type {Ent} from './ent.ts'
import {parseQuerySet, type QuerySet} from './ent-query.ts'
import {HUDSys} from './hud.ts'
import {NinePatchSys} from './nine-patch.ts'
import {OverrideSys} from './override.ts'
import {SpriteSys} from './sprite.ts'
import type {Sys} from './sys.ts'
import {TextWHSys, TextXYSys} from './text.ts'

/** ents are updated in insertion order. */
export class Zoo<Tag extends AnyTag> {
  #cursor: CursorEnt<Tag> | undefined
  readonly #ents: Set<Ent<Tag>> = new Set()
  #systems: {[component in keyof Ent<Tag>]?: Sys<Tag>} = {}
  #invalid: boolean = false

  add(...ents: readonly Ent<Tag>[]): void {
    for (const ent of ents) {
      if (debug) this.#validateQueries(ent)
      this.#ents.add(ent)
      if (ent.cursor) this.#cursor = ent as CursorEnt<Tag>
    }
  }

  addDefaultSystems(): void {
    this.addSystem({
      button: new ButtonSys(),
      cursor: new CursorSys(),
      hud: new HUDSys(),
      ninePatch: new NinePatchSys(),
      override: new OverrideSys(),
      sprite: new SpriteSys(),
      textWH: new TextWHSys(),
      textXY: new TextXYSys()
    })
  }

  addSystem(
    systems: {readonly [component in keyof Ent<Tag>]?: Sys<Tag>}
  ): void {
    Object.assign(this.#systems, systems)
  }

  clear(): void {
    this.#cursor = undefined
    this.#ents.clear() // to-do: run free on all systems.
    this.#systems = {}
  }

  // to-do: not support Tag makes comparisons with ent.sprite.tag hard. do I even want tag? what if tags started with `tag-`
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

  findById<T extends Ent<Tag>>(id: string): T | undefined {
    for (const ent of this.#ents) if (ent.id === id) return ent as T
  }

  update(v: Void<Tag, string>): void {
    this.#invalid = false
    for (const ent of this.#ents) {
      for (const k in ent) this.#systems[k as keyof Ent<Tag>]?.update?.(ent, v)
      if (ent.invalid && debug?.invalid)
        console.debug('ent update invalid', ent)
      this.#invalid ||= !!ent.invalid
      ent.invalid = false
    }
  }

  #validateQueries(ent: Ent<Tag>): void {
    for (const k in ent) {
      const sys = this.#systems[k as keyof Ent<Tag>]
      if (!sys) continue
      sys.querySet ??= parseQuerySet(sys.query)
      if (!queryEnt(ent, sys.querySet))
        throw Error(
          `ent ${ent.id ?? ent.name ?? '?'} does not satisfy query: ${sys.query}`
        )
    }
  }
}

function queryEnt<Ent>(
  ent: Readonly<Partial<Ent>>,
  query: QuerySet<Ent>
): boolean {
  return query.some(keys =>
    [...keys].every(k => (k[0] === '!' ? !(k.slice(1) in ent) : k in ent))
  )
}
