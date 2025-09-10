import type {TagFormat} from '../graphics/atlas.ts'
import type {VoidT} from '../void.ts'

export interface Ent {
  free?(v: VoidT<string, TagFormat>): void

  /** returns true if invalid. */
  update?(v: VoidT<string, TagFormat>): boolean | undefined
}
