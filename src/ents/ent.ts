import type {TagFormat} from '../graphics/atlas.ts'
import type {VoidT} from '../void.ts'

export interface Ent {
  /** returns true if invalid. */
  update?(v: VoidT<string, TagFormat>): boolean | undefined
}
