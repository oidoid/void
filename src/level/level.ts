import type {Ent} from '../ents/ent.ts'
import type {WH} from '../types/geo.ts'

export type Level = {
  ents: Ent[]
  keepZoo: boolean
  minWH: WH
}
