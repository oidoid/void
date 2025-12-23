import type {QueryEnt} from './ent-query.ts'
import type {Sys} from './sys.ts'

/** writes to invalid. */
export type OverrideEnt = QueryEnt<OverrideSys['query']>

export class OverrideSys implements Sys {
  readonly query = 'override' as const

  update(ent: OverrideEnt): void {
    if (ent.override.invalid != null) ent.invalid = ent.override.invalid
  }
}
