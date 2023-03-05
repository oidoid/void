import { Exact, NonNull } from '@/ooz'
import {
  parseUnpackedQuery,
  QueryToEnt,
  RunState,
  System,
  UnpackedQuery,
} from '@/void'

// Map a tuple of partial ents to an exact tuple of partial ents.
type PartialEntsToExact<Ent, Tuple> = Tuple extends
  [infer PartialEnt, ...infer Rest]
  ? [Exact<Partial<Ent>, PartialEnt>, ...PartialEntsToExact<Ent, Rest>]
  : []

export class ECS<Ent> {
  /** May be sparse. */
  readonly #systemsByOrder: System<Partial<Ent>, Ent>[] = []
  readonly #ents: Set<Partial<Ent>> = new Set()
  readonly #entsByQuery: { [query: string]: Set<Partial<Ent>> } = {}
  readonly #entsByComponent: Map<Ent[keyof Ent], Partial<Ent>> = new Map()

  /**
   * The transition-to state. Editing existing components occurs synchronously
   * but adding, removing, or replacing components, or adding or deleting an
   * ent, doesn't occur until all systems run.
   *
   * The next state is conceptually a diff aggregated across all system runs
   * with the following invariants:
   *
   *   {}                 → No change (eg, add).
   *   {[key]: val}       → Add or replace component at key.
   *   {[key]: undefined} → Remove component at key.
   *   undefined          → Remove ent.
   *
   * Surprising behavior may occur due to the transition delay such as:
   *
   * - Adding and then removing a component removes the old component.
   * - Replacing a component causes any subsequent edits on the old component to
   *   be lost.
   * - Accessing a component always retrieves the copy present at run start
   *   even if it was later replaced or removed.
   *
   * The synchronous read / asynchronous write approach allows easy reads and
   * stable components states for full runs. It's possible to allow systems to
   * take full ownerships of ents (e.g., `delete ent.key`) but they still have
   * to invalidate the Ent with the ECS after doing so which is both more code
   * and easy to forget. This also requires looser typing on the components a
   * system expects; the type must both allow entrance into the system and for
   * the key to be deletable.
   */
  readonly #patchesByEnt: Map<
    Partial<Ent>,
    Partial<Ent> | Partial<Record<keyof Ent, undefined>> | undefined
  > = new Map()
  readonly #queriesByStr: { [queryStr: string]: UnpackedQuery<Ent> } = {}

  /** Enqueue ents. */
  addEnt<PartialEnt>(ent: Exact<Partial<Ent>, PartialEnt>): PartialEnt
  addEnt<Tuple>(...ents: Tuple & PartialEntsToExact<Ent, Tuple>): Tuple
  addEnt(...ents: Partial<Ent>[]): Partial<Ent>[]
  addEnt(...ents: Partial<Ent>[]): Partial<Ent> | Partial<Ent>[] {
    for (const ent of ents) this.#patchesByEnt.set(ent, ent) // bit of a hack
    return ents.length == 1 ? ents[0]! : ents
  }

  addSystem<T>(system: T & System<Partial<Ent>, Ent>): T
  addSystem<Tuple>(...systems: Tuple & System<Partial<Ent>, Ent>[]): Tuple
  addSystem(
    ...systems: System<Partial<Ent>, Ent>[]
  ): System<Partial<Ent>, Ent>[]
  addSystem(
    ...systems: System<Partial<Ent>, Ent>[]
  ): System<Partial<Ent>, Ent> | System<Partial<Ent>, Ent>[] {
    for (const system of systems) this.insertSystem(-0, system)
    return systems.length == 1 ? systems[0]! : systems
  }

  get entSize(): number {
    return this.#ents.size
  }

  get(
    component: Ent[keyof Ent] & Record<never, never>,
  ): NonNullable<Partial<Ent>> {
    return NonNull(
      this.#entsByComponent.get(component),
      `Missing ent with component ${JSON.stringify(component)}.`,
    )
  }

  /**
   * Splice system at index where order:
   *
   *   -2 → two before the last system.
   *   -1 → one before the last system.
   *   -0 → the last system.
   *    0 → the first system.
   *    1 → the second system.
   *    1 → the third system.
   *
   * Order does not need to be contiguous. Inserting at an existing index
   * splices before the existing element.
   *
   * Effect is immediate.
   */
  insertSystem<T>(order: number, system: T & System<Partial<Ent>, Ent>): T {
    this.#systemsByOrder.splice(
      Object.is(order, -0) ? this.#systemsByOrder.length : order,
      0,
      system,
    )
    if (system.query in this.#entsByQuery) return system
    this.#queriesByStr[system.query] = parseUnpackedQuery(system.query)
    this.#entsByQuery[system.query] = new Set(
      this.query(system.query as `${keyof Ent & string}`),
    ) as Set<Partial<Ent>>
    return system
  }

  /**
   * Called by ECS after run. May also be used at initialization, before or
   * after a run, between system runs, or even between ent loops but not
   * mid-iteration.
   */
  patch(): void {
    for (const [ent, patch] of this.#patchesByEnt.entries()) {
      if (patch == null) this.#removeEntImmediately(ent)
      else {
        this.#ents.add(ent)
        this.#patchEnt(ent, patch)
        this.#invalidateSystemEnts(ent)
      }
      this.#patchesByEnt.delete(ent)
    }
  }

  /** Uncached query. */
  query<Q extends `${keyof Ent & string}${string}`>(
    query: Q,
  ): QueryToEnt<Ent, Q>[] {
    const ents = []
    const queryObj = this.#queriesByStr[query] ?? parseUnpackedQuery(query)
    for (const ent of this.#ents) {
      if (this.#queryEnt(ent, queryObj)) ents.push(ent)
    }
    return ents as QueryToEnt<Ent, Q>[]
  }

  run(state: RunState<Partial<Ent>>): void {
    for (const system of this.#systemsByOrder) {
      const ents = this.#systemEnts(system)
      system.run?.(ents, state)
      if (system.runEnt != null) {
        for (const ent of ents) system.runEnt(ent, state)
      }
    }
    this.patch()
  }

  /** Enqueue components for removal. */
  removeKeys(ent: Partial<Ent>, ...keys: readonly (keyof Ent)[]): void {
    if (keys.length == 0) return
    const patch: Partial<Ent> | undefined = this.#patchesByEnt.has(ent)
      ? this.#patchesByEnt.get(ent)
      : {}
    if (patch == null) return // Deleted.
    for (const key of keys) patch[key] = undefined
    this.#patchesByEnt.set(ent, patch)
  }

  /** Enqueue an ent for removal. */
  removeEnt(ent: Partial<Ent>): void {
    this.#patchesByEnt.set(ent, undefined)
  }

  // to-do: this is a bit confusing since it only impacts keys specified.
  /** Replace or remove components. */
  setEnt(
    ent: Partial<Ent>,
    patch: Partial<Ent> | Partial<Record<keyof Ent, undefined>>,
  ): void {
    const pending: Partial<Ent> | undefined = this.#patchesByEnt.has(ent)
      ? this.#patchesByEnt.get(ent)
      : {}
    if (pending == null) return // Deleted.
    this.#patchesByEnt.set(ent, { ...pending, patch })
  }

  #invalidateSystemEnts(ent: Partial<Ent>): void {
    for (const [query, ents] of Object.entries(this.#entsByQuery)) {
      if (this.#queryEnt(ent, this.#queriesByStr[query]!)) ents.add(ent)
      else ents.delete(ent)
    }
  }

  /** Test whether an ent matches query. */
  #queryEnt(ent: Partial<Ent>, query: UnpackedQuery<Ent>): boolean {
    return query.some((keys) =>
      [...keys].every((key) =>
        key[0] == '!' ? !(key.slice(1) in ent) : key in ent
      )
    )
  }

  /** Remove all references to an ent. */
  #removeEntImmediately(ent: Partial<Ent>): void {
    for (const ents of Object.values(this.#entsByQuery)) ents.delete(ent)
    for (const key in ent) this.#entsByComponent.delete(ent[key]!)
    this.#ents.delete(ent)
  }

  /** Get all ents matching system. */
  #systemEnts(system: System<Partial<Ent>, Ent>): ReadonlySet<Ent> {
    return this.#entsByQuery[system.query] as ReadonlySet<
      unknown
    > as ReadonlySet<Ent>
  }

  #patchEnt(ent: Partial<Ent>, patch: Partial<Ent>): void {
    for (const key in patch) {
      if (patch[key] == null) {
        this.#entsByComponent.delete(ent[key]!)
        delete ent[key]
      } else {
        ent[key] = patch[key]
        this.#entsByComponent.set(ent[key]!, ent)
      }
    }
  }
}
