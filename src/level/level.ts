import type {Ent} from '../ents/ent.ts'
import type {WH} from '../types/geo.ts'

export type Level = {
  background: number | undefined
  minWH: WH | undefined
  minScale: number | undefined
  zoo: LevelZoo
  zoomOut: number | undefined
}
export interface LevelZoo {
  default: Ent[]
}
