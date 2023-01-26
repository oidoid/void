import { ECSUpdate } from '@/void'

export interface System<T, Update extends ECSUpdate = ECSUpdate> {
  /** These are the keys populated in each set. */
  readonly query: Set<keyof T>
  /**
   * If specified, returns true if this update should be skipped (for
   * performance).
   */
  skip?(update: Update): boolean
  /** If specified, called once for all matching ents. */
  update?(sets: Set<T>, update: Update): void
  /** If specified and update() is not, called for each matching ent. */
  updateEnt?(set: T, update: Update): void
}
