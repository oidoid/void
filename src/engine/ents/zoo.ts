import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'
import {parseQuery} from './ent-query.ts'
import type {Hook} from './hook.ts'

export interface Zoo {
  default: Set<Ent>
}
export type HookMap = {[k in keyof Ent]?: Hook}
type QueryMap = {[k in keyof Ent]?: string[][]}

export function zooFindByID<T extends Ent>(
  ents: Iterable<Readonly<Ent>, undefined, undefined>,
  id: string
): T | undefined {
  for (const ent of ents) if (ent.id === id) return ent as T
}

export function zooUpdate(
  ents: Iterable<Ent, undefined, undefined>,
  hooks: Readonly<HookMap>,
  v: Void
): void {
  const start = performance.now()
  for (const ent of ents) {
    // to-do: move to Ent.hooks? not many props don't have a hook.
    for (const k in ent) hooks[k as keyof Ent]?.update?.(ent as never, v)
    // if (debug?.invalid && ent.invalid >= v.tick.start)
    //   console.debug('[invalid] ent update invalid', ent)
    v.invalid ||= ent.invalid >= v.tick.start
  }
  v.metrics.cur.update += performance.now() - start
}

export function zooValidate(
  ents: Iterable<Readonly<Ent>, undefined, undefined>,
  hooks: Readonly<HookMap>
): void {
  const queries: QueryMap = {}
  for (const [k, hook] of Object.entries(hooks))
    queries[k as keyof Ent] = parseQuery(hook.query as keyof Ent)
  for (const ent of ents) validateQueries(ent, queries)
}

function queryEnt<Ent>(
  ent: Readonly<Ent>,
  query: readonly (readonly string[])[]
): boolean {
  return query.some(keys =>
    keys.every(k => (k[0] === '!' ? !(k.slice(1) in ent) : k in ent))
  )
}

function validateQueries(
  ent: Readonly<Ent>,
  queries: Readonly<QueryMap>
): void {
  for (const k in ent) {
    const query = queries[k as keyof Ent]
    if (query && !queryEnt(ent, query))
      throw Error(
        `ent ${ent.id ?? ent.name ?? '?'} does not satisfy ${k} query ${query}`
      )
  }
}
