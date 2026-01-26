import type {CursorEnt} from '../ents/cursor.ts'
import type {Zoo} from '../ents/zoo.ts'
import type {Void} from '../void.ts'

export interface Loader {
  cursor?: CursorEnt
  update(v: Void): void
  zoo: Zoo
}
