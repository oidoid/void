import type {TagFormat} from '../graphics/atlas.ts'
import type {Void} from '../void.ts'

/** declaration merge for base needs. */
export interface Ent {
  free?(v: Void<TagFormat, string>): void

  /** returns true if a render is required. */
  update?(v: Void<TagFormat, string>): boolean | undefined
}
