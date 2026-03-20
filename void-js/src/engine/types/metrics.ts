import type {Millis} from './time.ts'

export type Metrics = {
  /** in-progress accumulator for the current frame. */
  cur: {collide: Millis; update: Millis}
  prev: {
    collide: Millis
    draw: Millis
    /** duration from frame delivery to yield. */
    frame: Millis
    update: Millis
  }
}
