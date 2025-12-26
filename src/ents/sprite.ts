import type {Sys, SysEnt} from './sys.ts'

export type SpriteEnt = SysEnt<SpriteSys>

/** writes sprite, invalid. */
export class SpriteSys implements Sys {
  readonly query = 'sprite'

  free(ent: SpriteEnt): void {
    ent.sprite.free()
    // ent.sprite = undefined to-do: who does this <-- zoo?
    ent.invalid = true
  }
}
