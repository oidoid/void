import type {Void} from '../void.ts'
import {buttonOnStart} from './button.ts'
import type {Hook, HookEnt} from './hook.ts'

export type DebugLoseContextEnt = HookEnt<DebugLoseContextHook>

export class DebugLoseContextHook implements Hook {
  readonly query = 'button & debugLoseContext & sprite'

  update(ent: DebugLoseContextEnt, v: Void): void {
    if (!v.renderer.loseContext) return

    if (
      ent.debugLoseContext.end &&
      performance.now() >= ent.debugLoseContext.end
    ) {
      ent.debugLoseContext.end = 0
      v.renderer.loseContext?.restoreContext()
      return
    }

    if (!buttonOnStart(ent)) return

    v.renderer.loseContext.loseContext()
    ent.debugLoseContext.end = performance.now() + 1000 + v.random.num * 2000
  }
}
