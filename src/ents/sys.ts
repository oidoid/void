import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'

export type Sys = {
  /**
   * query of the form `[!]<key>[ <& or |><query>]`. eg, `'a & b | !a & c'`. no
   * grouping is permitted.
   */
  query: string
  querySet?: string[][]
  free?(ent: Ent, v: Void): void
  update?(ent: Ent, v: Void): void
}
