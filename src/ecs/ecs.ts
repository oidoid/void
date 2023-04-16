import { assert, Exact, NonNull } from '@/ooz'
import { EQL, Game, parseQuerySet, QueryEnt, QuerySet, System } from '@/void'

// Map a tuple of partial ents to an exact tuple of partial ents.
type PartialEntsToExact<Ent, Tuple> = Tuple extends
  [infer PartialEnt, ...infer Rest]
  ? [Exact<Partial<Ent>, PartialEnt>, ...PartialEntsToExact<Ent, Rest>]
  : []

export class ECS<Ent> {
  /** May be sparse. */
  readonly #systemByOrder: System<Partial<Ent>, Ent>[] = []
  readonly #ents: Set<Partial<Ent>> = new Set()
  readonly #entsByQuery: { [query: string]: Set<Partial<Ent>> } = {}
  readonly #entByComponent: Map<Ent[keyof Ent], Partial<Ent>> = new Map()

  /**
   * The transition-to state. Editing existing components occurs synchronously
   * but adding, removing, or replacing components, or adding or deleting an
   * ent, doesn't occur until all systems run.
   *
   * The next state is conceptually a diff aggregated across all system runs
   * with the following invariants:
   *
   *   {}                 → No change. This shouldn't occur but does nothing.
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
  readonly #patchByEnt: Map<
    Partial<Ent>,
    Partial<Ent> | Partial<Record<keyof Ent, undefined>> | undefined
  > = new Map()
  readonly #setByQuery: { [query: string]: QuerySet<Ent> } = {}

  /** Enqueue ents. */
  addEnt<PartialEnt>(ent: Exact<Partial<Ent>, PartialEnt>): PartialEnt
  addEnt<const Tuple>(
    ...ents:
      & Tuple
      & readonly [
        PartialEntsToExact<Ent, Tuple>,
        ...PartialEntsToExact<Ent, Tuple>[],
      ]
  ): Tuple
  addEnt<Array>(...ents: Array & Partial<Ent>[]): Array
  addEnt(...ents: Partial<Ent>[]): Partial<Ent> | Partial<Ent>[] {
    // Use the ent reference for the patch key with the ent as also as the patch
    // itself. This is a bit redundant since the ent already has these
    // components set but patching uses it to invalidate the relevant queries.
    for (const ent of ents) this.#patchByEnt.set(ent, ent)
    return ents.length === 1 ? ents[0]! : ents
  }

  addSystem<T>(system: T & System<Partial<Ent>>): T
  addSystem<const Tuple>(
    ...systems:
      & Tuple
      & readonly [System<Partial<Ent>>, ...System<Partial<Ent>>[]]
  ): Tuple
  addSystem<Array>(...systems: Array & System<Partial<Ent>>[]): Array
  addSystem(
    ...systems: System<Partial<Ent>, Ent>[]
  ): System<Partial<Ent>, Ent> | System<Partial<Ent>, Ent>[] {
    for (const system of systems) this.insertSystem(-0, system)
    return systems.length === 1 ? systems[0]! : systems
  }

  get entSize(): number {
    return this.#ents.size
  }

  get(
    component: Ent[keyof Ent] & Record<never, never>,
  ): NonNullable<Partial<Ent>> {
    return NonNull(
      this.#entByComponent.get(component),
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
   *    2 → the third system.
   *
   * Order does not need to be contiguous. Inserting at an existing index
   * splices before the existing element.
   *
   * Effect is immediate.
   */
  insertSystem<T>(order: number, system: T & System<Partial<Ent>, Ent>): T {
    this.#systemByOrder.splice(
      Object.is(order, -0) ? this.#systemByOrder.length : order,
      0,
      system,
    )
    if (system.query in this.#entsByQuery) return system
    this.#setByQuery[system.query] = parseQuerySet(system.query)
    this.#entsByQuery[system.query] = new Set(
      this.#uncachedQuery(system.query as EQL<Ent, ''>),
    ) as Set<Partial<Ent>>
    return system
  }

  /**
   * Called by ECS after run. May also be used at initialization, before or
   * after a run, between system runs, or even between ent loops but not
   * mid-iteration.
   */
  patch(): void {
    for (const [ent, patch] of this.#patchByEnt.entries()) {
      if (patch == null) this.#removeEntImmediately(ent)
      else {
        this.#ents.add(ent)
        this.#patchEnt(ent, patch)
        this.#invalidateSystemEnts(ent)
      }
    }
    this.#patchByEnt.clear()
  }

  /** One-off query. Does not write to cache (but may read). */
  *query<const Query>(
    query: EQL<Ent, Query>,
  ): IterableIterator<QueryEnt<Ent, Query>> {
    const cache = this.#entsByQuery[query]
    if (cache != null) {
      return yield* cache.values() as IterableIterator<QueryEnt<Ent, Query>>
    }
    yield* this.#uncachedQuery<Query>(query)
  }

  queryOne<const Query>(query: EQL<Ent, Query>): QueryEnt<Ent, Query> {
    const ents = [...this.query(query)]
    assert(
      ents.length === 1,
      `Expected exactly one ent for "${query}" query, got ${ents.length}.`,
    )
    return ents[0]!
  }

  /** Enqueue components for removal. */
  removeKeys(
    ent: Partial<Ent>,
    ...keys: readonly [keyof Ent, ...(keyof Ent)[]]
  ): void
  removeKeys(ent: Partial<Ent>, ...keys: readonly (keyof Ent)[]): void
  removeKeys(ent: Partial<Ent>, ...keys: readonly (keyof Ent)[]): void {
    const patch: Partial<Ent> | undefined = this.#patchByEnt.has(ent)
      ? this.#patchByEnt.get(ent)
      : {}
    if (patch == null) return // Deleted.

    for (const key of keys) {
      if (key in ent) patch[key] = undefined // Remove.
      else delete patch[key] // Nothing to remove.
    }
    if (Object.keys(patch).length === 0) this.#patchByEnt.delete(ent) // Nothing to do.
    else this.#patchByEnt.set(ent, patch)
  }

  /** Enqueue an ent for removal. */
  removeEnt(ent: Partial<Ent>): void {
    this.#patchByEnt.set(ent, undefined)
  }

  run(game: Game<Ent>): void {
    for (const system of this.#systemByOrder) {
      const ents = this.#systemEnts(system)
      system.run?.(ents, game)
      if (system.runEnt != null) {
        for (const ent of ents) system.runEnt(ent, game)
      }
    }
    this.patch()
  }

  /**
   * Replace or remove components. Unreferenced components in ent are unchanged.
   */
  setEnt(
    ent: Partial<Ent>,
    patch: Partial<Ent> | Partial<Record<keyof Ent, undefined>>,
  ): void {
    const pending: Partial<Ent> | undefined = this.#patchByEnt.has(ent)
      ? this.#patchByEnt.get(ent)
      : {}
    if (pending == null) return // Deleted.

    Object.assign(pending, patch)
    if (Object.keys(pending).length === 0) this.#patchByEnt.delete(ent) // Nothing to do.
    else this.#patchByEnt.set(ent, pending)
  }

  #invalidateSystemEnts(ent: Partial<Ent>): void {
    for (const [query, ents] of Object.entries(this.#entsByQuery)) {
      if (queryEnt(ent, this.#setByQuery[query]!)) ents.add(ent)
      else ents.delete(ent)
    }
  }

  #patchEnt(ent: Partial<Ent>, patch: Partial<Ent>): void {
    for (const key in patch) {
      if (patch[key] == null) {
        this.#entByComponent.delete(ent[key]!)
        delete ent[key]
      } else {
        ent[key] = patch[key]
        this.#entByComponent.set(ent[key]!, ent)
      }
    }
  }

  /** Remove all references to an ent. */
  #removeEntImmediately(ent: Partial<Ent>): void {
    for (const ents of Object.values(this.#entsByQuery)) ents.delete(ent)
    for (const key in ent) this.#entByComponent.delete(ent[key]!)
    this.#ents.delete(ent)
  }

  /** Get all ents matching system. */
  #systemEnts(system: System<Partial<Ent>, Ent>): ReadonlySet<Ent> {
    return this.#entsByQuery[system.query] as ReadonlySet<
      unknown
    > as ReadonlySet<Ent>
  }

  /** Neither read nor modifies cache. */
  *#uncachedQuery<Query>(
    query: EQL<Ent, Query>,
  ): IterableIterator<QueryEnt<Ent, Query>> {
    const querySet = parseQuerySet(query)
    for (const ent of this.#ents) {
      if (queryEnt(ent, querySet)) yield ent as QueryEnt<Ent, Query>
    }
  }
}

/** Test whether an ent matches query. */
function queryEnt<Ent>(ent: Partial<Ent>, query: QuerySet<Ent>): boolean {
  return query.some((keys) =>
    [...keys].every((key) =>
      key[0] === '!' ? !(key.slice(1) in ent) : key in ent
    )
  )
}
