import type {AnyTag} from '../graphics/atlas.ts'
import type {QueryEnt} from './ent-query.ts'
import type {Sys} from './sys.ts'

/** writes to invalid. */
export type OverrideEnt<Tag extends AnyTag> = QueryEnt<
  Tag,
  OverrideSys<Tag>['query']
>

export class OverrideSys<Tag extends AnyTag> implements Sys<Tag> {
  readonly query = 'override' as const

  update(ent: OverrideEnt<Tag>): void {
    if (ent.override.invalid != null) ent.invalid = ent.override.invalid
  }
}
