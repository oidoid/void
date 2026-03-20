import * as V from '../../engine/index.ts'

export type LoadTilesetEnt = V.HookEnt<LoadTilesetHook>

/** picks and loads a tileset image. */
export class LoadTilesetHook implements V.Hook {
  readonly query = 'button & loadTileset & sprite'

  update(ent: LoadTilesetEnt, v: V.Void): void {
    if (V.buttonOnStart(ent)) v.loader.loadTileset(v)
  }
}
