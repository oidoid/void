import type {TagFormat} from '../graphics/atlas.ts'
import type {VoidT} from '../void.ts'
import type {EID} from './eid.ts'

export interface Ent {
  eid: EID
  update?(v: VoidT<string, TagFormat>): void
}
