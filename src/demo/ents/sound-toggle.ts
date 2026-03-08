import * as V from '../../engine/index.ts'

export type SoundToggleEnt = V.HookEnt<SoundToggleHook>

export class SoundToggleHook implements V.Hook {
  readonly query = 'button & soundToggle & sprite'

  update(ent: SoundToggleEnt, v: V.Void): void {
    if (!ent.button.started) return
    v.loader.sound = V.buttonOn(ent)
  }
}
