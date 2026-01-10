import type {Hook, HookEnt} from './hook.ts'

/** writes to invalid. */
export type OverrideEnt = HookEnt<OverrideHook>

export class OverrideHook implements Hook {
  readonly query = 'override'

  update(ent: OverrideEnt): void {
    if (ent.override.invalid != null) ent.invalid = ent.override.invalid
  }
}
