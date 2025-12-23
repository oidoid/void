import type {QueryEnt} from './ent-query.ts'
import type {Sys} from './sys.ts'

export type SpriteEnt = QueryEnt<SpriteSys['query']>

/** writes sprite, invalid. */
export class SpriteSys implements Sys {
  readonly query = 'sprite' as const

  free(ent: SpriteEnt): void {
    ent.sprite.free()
    // ent.sprite = undefined to-do: who does this <-- zoo?
    ent.invalid = true
  }
}
