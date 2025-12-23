import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'
import type {QuerySet} from './ent-query.ts'

export type Sys = {
  query: string
  querySet?: QuerySet<Ent>
  free?(ent: Ent, v: Void): void
  update?(ent: Ent, v: Void): void
}
