import type {Void} from '../void.ts'
import type {QueryEnt} from './ent-query.ts'

export type HookEnt<T extends Hook> = QueryEnt<T['query']>

export interface Hook {
  /**
   * query of the form `[!]<key>[ <& or |><query>]`. eg, `'a & b | !a & c'`. no
   * grouping is permitted.
   */
  query: string
  free?(ent: HookEnt<this>, v: Void): void
  update?(ent: HookEnt<this>, v: Void): void
}
