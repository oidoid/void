import type {Void} from '../void.ts'
import type {QueryEnt} from './ent-query.ts'

export type SysEnt<T extends Sys> = QueryEnt<T['query']>

export interface Sys {
  /**
   * query of the form `[!]<key>[ <& or |><query>]`. eg, `'a & b | !a & c'`. no
   * grouping is permitted.
   */
  query: string
  querySet?: string[][]
  free?(ent: SysEnt<this>, v: Void): void
  update?(ent: SysEnt<this>, v: Void): void
}
