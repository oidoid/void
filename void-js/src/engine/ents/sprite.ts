import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'

export type SpriteEnt = HookEnt<SpriteHook>

/** writes sprite, invalid. */
export class SpriteHook implements Hook {
  readonly query = 'sprite'

  free(ent: SpriteEnt, v: Void): void {
    ent.sprite.free()
    // ent.sprite = undefined to-do: who does this <-- zoo?
    ent.invalid = v.tick.start
  }
}
