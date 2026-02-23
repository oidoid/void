import {
  exitFullscreen,
  isFullscreen,
  requestFullscreen
} from '../utils/fullscreen-util.ts'
import type {Void} from '../void.ts'
import {buttonOn, buttonSetOn} from './button.ts'
import type {Hook, HookEnt} from './hook.ts'

export type FullscreenToggleEnt = HookEnt<FullscreenToggleHook>

export class FullscreenToggleHook implements Hook {
  readonly query = 'button & fullscreenToggle & sprite'

  update(ent: FullscreenToggleEnt, v: Void): void {
    const fullscreen = isFullscreen()

    if (!ent.button.started && buttonOn(ent) !== fullscreen) {
      buttonSetOn(ent, fullscreen)
      return
    }

    if (!ent.button.started) return

    if (buttonOn(ent))
      void requestFullscreen(
        v,
        ent.fullscreenToggle.noLock ? 'NoLock' : undefined
      )
    else void exitFullscreen(v)
  }
}
