import * as V from '../../engine/index.ts'

export type LoadLevelEnt = V.HookEnt<LoadLevelHook>

/** picks and loads a level file. */
export class LoadLevelHook implements V.Hook {
  readonly query = 'button & loadLevel & sprite'

  update(ent: LoadLevelEnt, v: V.Void): void {
    if (V.buttonOnStart(ent)) v.loader.loadLevel(v)
  }
}
