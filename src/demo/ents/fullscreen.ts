import * as V from '../../engine/index.ts'

export type FullscreenEnt = V.HookEnt<FullscreenHook>

export class FullscreenHook implements V.Hook {
  readonly query = 'button & fullscreen & sprite'

  update(ent: FullscreenEnt, v: V.Void): void {
    const isFullscreen = document.fullscreenElement === v.canvas

    // sync toggle with actual state when user exits via Escape / browser UI.
    if (!ent.button.started && V.buttonOn(ent) !== isFullscreen) {
      V.buttonSetOn(ent, isFullscreen)
      return
    }

    if (!ent.button.started) return

    if (V.buttonOn(ent)) void V.requestFullscreen(v.canvas)
    else if (document.fullscreenElement) void document.exitFullscreen()
  }
}
