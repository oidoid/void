import type {TagFormat} from '../graphics/atlas.ts'
import type {Millis} from '../types/time.ts'
import type {Void} from '../void.ts'

export interface Ent<out Tag extends TagFormat> {
  free?(v: Void<Tag, string>): void
  /** returns true if a render is required. */
  update?(v: Void<Tag, string>, millis: Millis): boolean | undefined
}
