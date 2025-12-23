import type {Ent} from '../ents/ent.ts'
import type {AnyTag} from '../graphics/atlas.ts'
import type {WH} from '../types/geo.ts'

export type Level<Tag extends AnyTag> = {
  ents: Ent<Tag>[]
  keepZoo: boolean
  minWH: WH
}
