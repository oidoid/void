import * as V from '../../engine/index.ts'

export type CollideToggleEnt = V.HookEnt<CollideToggleHook>

export class CollideToggleHook implements V.Hook {
  readonly query = 'button & collideToggle & sprite'

  update(ent: CollideToggleEnt, v: V.Void): void {
    if (!ent.button.started) return
    v.loader.collide = V.buttonOn(ent)
  }
}
