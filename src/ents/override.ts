import type {Sys, SysEnt} from './sys.ts'

/** writes to invalid. */
export type OverrideEnt = SysEnt<OverrideSys>

export class OverrideSys implements Sys {
  readonly query = 'override' as const

  update(ent: OverrideEnt): void {
    if (ent.override.invalid != null) ent.invalid = ent.override.invalid
  }
}
