import type {Ent} from '../ents/ent.ts'
import type {WH} from '../types/geo.ts'

export type Level = {minWH: WH; zoo: {default: Ent[]; [list: string]: Ent[]}}
