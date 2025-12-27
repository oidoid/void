import {debug} from '../utils/debug.ts'
import type {Void} from '../void.ts'
import {ButtonSys} from './button.ts'
import {type CursorEnt, CursorSys} from './cursor.ts'
import {DebutInputSys} from './debug-input.ts'
import type {Ent} from './ent.ts'
import {type EQL, parseQuerySet, type QueryEnt} from './ent-query.ts'
import {FPSSys} from './fps.ts'
import {HUDSys} from './hud.ts'
import type {LoaderEnt} from './loader.ts'
import {NinePatchSys} from './nine-patch.ts'
import {OverrideSys} from './override.ts'
import {SpriteSys} from './sprite.ts'
import type {Sys} from './sys.ts'
import {TextWHSys, TextXYSys} from './text.ts'

/** ents are updated in insertion order. */
export class Zoo {
  #cursor: CursorEnt | undefined
  #loader!: LoaderEnt
  readonly #ents: Set<Ent> = new Set()
  #systems: {[component in keyof Ent]?: Sys} = {}
  #invalid: boolean = false

  add(...ents: readonly Ent[]): void {
    for (const ent of ents) {
      if (debug) this.#validateQueries(ent)
      this.#ents.add(ent)
      if (ent.cursor) this.#cursor = ent as CursorEnt
      else if (ent.loader) this.#loader = ent as LoaderEnt
    }
  }

  addDefaultSystems(): void {
    this.addSystem({
      button: new ButtonSys(),
      cursor: new CursorSys(),
      debugInput: new DebutInputSys(),
      fps: new FPSSys(),
      hud: new HUDSys(),
      ninePatch: new NinePatchSys(),
      override: new OverrideSys(),
      sprite: new SpriteSys(),
      textWH: new TextWHSys(),
      textXY: new TextXYSys()
    })
  }

  addSystem(systems: {readonly [component in keyof Ent]?: Sys}): void {
    Object.assign(this.#systems, systems)
  }

  clear(): void {
    this.#cursor = undefined
    this.#ents.clear() // to-do: run free on all systems. don't clear loader.
    this.#systems = {}
  }

  get cursor(): CursorEnt | undefined {
    return this.#cursor
  }

  get loader(): LoaderEnt {
    return this.#loader
  }

  get invalid(): boolean {
    return this.#invalid
  }

  *query<const Query>(
    query: EQL<Ent, Query>
  ): IterableIterator<QueryEnt<Query>> {
    const querySet = parseQuerySet(query)
    for (const ent of this.#ents)
      if (queryEnt(ent, querySet)) yield ent as QueryEnt<Query>
  }

  remove(...ents: readonly Readonly<Ent>[]): void {
    for (const ent of ents) {
      if (ent !== this.#loader) this.#ents.delete(ent)
      else if (ent === this.#cursor) this.#cursor = undefined
    }
  }

  findById<T extends Ent>(id: string): T | undefined {
    for (const ent of this.#ents) if (ent.id === id) return ent as T
  }

  update(v: Void): void {
    this.#invalid = false
    for (const ent of this.#ents) {
      for (const k in ent)
        this.#systems[k as keyof Ent]?.update?.(ent as never, v)
      if (ent.invalid && debug?.invalid)
        console.debug('[invalid] ent update invalid', ent)
      this.#invalid ||= !!ent.invalid
      ent.invalid = false
    }
  }

  #validateQueries(ent: Ent): void {
    for (const k in ent) {
      const sys = this.#systems[k as keyof Ent]
      if (!sys) continue
      sys.querySet ??= parseQuerySet(sys.query as keyof Ent)
      if (!queryEnt(ent, sys.querySet))
        throw Error(
          `ent ${ent.id ?? ent.name ?? '?'} does not satisfy query: ${sys.query}`
        )
    }
  }
}

function queryEnt<Ent>(
  ent: Readonly<Ent>,
  query: readonly (readonly string[])[]
): boolean {
  return query.some(keys =>
    keys.every(k => (k[0] === '!' ? !(k.slice(1) in ent) : k in ent))
  )
}
