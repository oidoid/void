import type {Void} from '../void.ts'
import {buttonOnStart} from './button.ts'
import type {Hook, HookEnt} from './hook.ts'

export type DebugLoseContextButtonEnt = HookEnt<DebugLoseContextButtonHook>

export class DebugLoseContextButtonHook implements Hook {
  readonly query = 'button & debugLoseContextButton & sprite'

  update(ent: DebugLoseContextButtonEnt, v: Void): void {
    if (!v.renderer.loseContext) return

    if (
      ent.debugLoseContextButton.end &&
      performance.now() >= ent.debugLoseContextButton.end
    ) {
      ent.debugLoseContextButton.end = 0
      v.renderer.loseContext?.restoreContext()
      return
    }

    if (!buttonOnStart(ent)) return

    v.renderer.loseContext.loseContext()
    ent.debugLoseContextButton.end =
      performance.now() + 1000 + v.random.num * 2000
  }
}
