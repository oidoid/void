import type {Hook, HookEnt} from './hook.ts'

export type SpriteEnt = HookEnt<SpriteHook>

/** writes sprite, invalid. */
export class SpriteHook implements Hook {
  readonly query = 'sprite'

  free(ent: SpriteEnt): void {
    ent.sprite.free()
    // ent.sprite = undefined to-do: who does this <-- zoo?
    ent.invalid = true
  }
}
