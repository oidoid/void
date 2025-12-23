import type {AnyTag} from '../graphics/atlas.ts'
import type {QueryEnt} from './ent-query.ts'
import type {Sys} from './sys.ts'

export type SpriteEnt<Tag extends AnyTag> = QueryEnt<
  Tag,
  SpriteSys<Tag>['query']
>

/** writes sprite, invalid. */
export class SpriteSys<Tag extends AnyTag> implements Sys<Tag> {
  readonly query = 'sprite' as const

  free(ent: SpriteEnt<Tag>): void {
    ent.sprite.free()
    // ent.sprite = undefined to-do: who does this <-- zoo?
    ent.invalid = true
  }
}
