import {requestFullscreen} from '../utils/canvas-util.ts'
import type {Void} from '../void.ts'
import {buttonOn, buttonSetOn} from './button.ts'
import type {Hook, HookEnt} from './hook.ts'

export type FullscreenToggleEnt = HookEnt<FullscreenToggleHook>

export class FullscreenToggleHook implements Hook {
  readonly query = 'button & fullscreenToggle & sprite'

  update(ent: FullscreenToggleEnt, v: Void): void {
    const isFullscreen =
      document.fullscreenElement === v.canvas ||
      (innerWidth === screen.width && innerHeight === screen.height)

    if (!ent.button.started && buttonOn(ent) !== isFullscreen) {
      buttonSetOn(ent, isFullscreen)
      return
    }

    if (!ent.button.started) return

    if (buttonOn(ent)) void requestFullscreen(v.canvas)
    else if (document.fullscreenElement) void document.exitFullscreen()
  }
}
