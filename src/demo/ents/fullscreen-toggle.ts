import * as V from '../../engine/index.ts'

export type FullscreenToggleEnt = V.HookEnt<FullscreenToggleHook>

export class FullscreenToggleHook implements V.Hook {
  readonly query = 'button & fullscreenToggle & sprite'

  update(ent: FullscreenToggleEnt, v: V.Void): void {
    const isFullscreen = document.fullscreenElement === v.canvas

    if (!ent.button.started && V.buttonOn(ent) !== isFullscreen) {
      V.buttonSetOn(ent, isFullscreen)
      return
    }

    if (!ent.button.started) return

    if (V.buttonOn(ent)) void V.requestFullscreen(v.canvas)
    else if (document.fullscreenElement) void document.exitFullscreen()
  }
}
