import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'

/** writes to invalid. */
export type OverrideEnt = HookEnt<OverrideHook>

export class OverrideHook implements Hook {
  readonly query = 'override'

  update(ent: OverrideEnt, v: Void): void {
    if (ent.override.invalid == null) return
    ent.invalid = ent.override.invalid ? v.tick.start : 0
  }
}
