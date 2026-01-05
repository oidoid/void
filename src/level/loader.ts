import type {CursorEnt} from '../ents/cursor.ts'
import type {Void} from '../void.ts'

export interface Loader {
  cursor?: CursorEnt
  update(v: Void): void
}
