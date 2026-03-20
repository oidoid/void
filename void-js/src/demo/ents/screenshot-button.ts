import * as V from '../../engine/index.ts'

export type ScreenshotButtonEnt = V.HookEnt<ScreenshotButtonHook>

export class ScreenshotButtonHook implements V.Hook {
  readonly query = 'button & screenshotButton & sprite'

  update(ent: ScreenshotButtonEnt, v: V.Void): void {
    if (!V.buttonOnStart(ent)) return
    void V.downloadScreenshot(v.canvas, 'void')
  }
}
