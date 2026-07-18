export interface Ent {
  /**
   * frame timestamp (`v.tick.start`) when this ent was last updated
   * (preferred), or `Infinity` to force update every frame, or `0` to suppress
   * updates. ents write `v.tick.start` after mutating to flag rendering and
   * recompute by other hooks. ents may read another ent's `invalid` to
   * determine whether it was updated in the current frame
   * (`const updated = ref.invalid >= v.tick.start`).
   */
  invalid: Millis | typeof Infinity
}
