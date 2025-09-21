import type {TagFormat} from '../graphics/atlas.ts'
import type {VoidT} from '../void.ts'

/** declaration merge for base needs. */
export interface Ent {
  free?(v: VoidT<string, TagFormat>): void

  /** returns true if a render is required. */
  update?(v: VoidT<string, TagFormat>): boolean | undefined
}
