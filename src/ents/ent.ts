import type {TagFormat} from '../graphics/atlas.ts'
import type {Void} from '../void.ts'

export interface Ent<Tag extends TagFormat> {
  free?(): void
  /** returns true if a render is required. */
  update?(v: Void<Tag, string>): boolean | undefined
}
