import type {AnyTag} from '../graphics/atlas.ts'
import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'
import type {QuerySet} from './ent-query.ts'

export type Sys<Tag extends AnyTag> = {
  query: string
  querySet?: QuerySet<Ent<Tag>>
  free?(ent: Ent<Tag>, v: Void<Tag, string>): void
  update?(ent: Ent<Tag>, v: Void<Tag, string>): void
}
