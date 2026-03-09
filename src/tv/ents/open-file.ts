import * as V from '../../engine/index.ts'

export type OpenFileEnt = V.HookEnt<OpenFileHook>

/** opens and loads an app. */
export class OpenFileHook implements V.Hook {
  readonly query = 'button & openFile & sprite'

  update(ent: OpenFileEnt, _v: V.Void): void {
    if (!V.buttonOn(ent)) return
  }
}
