import type {Ent} from '../ents/ent.ts'
import type {WH} from '../types/geo.ts'

export type Level = {minWH: WH; zoo: LevelZoo}
export interface LevelZoo {
  default: Ent[]
}
