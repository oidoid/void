import * as V from '../../engine/index.ts'

export type ScreenshotEnt = V.HookEnt<ScreenshotHook>

export class ScreenshotHook implements V.Hook {
  readonly query = 'button & screenshot & sprite'

  update(ent: ScreenshotEnt, v: V.Void): void {
    if (!V.buttonOnStart(ent)) return
    void V.downloadScreenshot(v.canvas, 'void')
  }
}
