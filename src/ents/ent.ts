import type {TagFormat} from '../graphics/atlas.ts'
import type {Void} from '../void.ts'

export interface Ent {
  free?(v: Void<TagFormat, string>): void
  /** returns true if a render is required. */
  update?(v: Void<TagFormat, string>): boolean | undefined
}
