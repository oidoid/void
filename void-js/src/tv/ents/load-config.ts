import * as V from '../../engine/index.ts'

export type LoadConfigEnt = V.HookEnt<LoadConfigHook>

/** picks and loads a game config file. */
export class LoadConfigHook implements V.Hook {
  readonly query = 'button & loadConfig & sprite'

  update(ent: LoadConfigEnt, v: V.Void): void {
    if (V.buttonOnStart(ent)) v.loader.loadConfig(v)
  }
}
