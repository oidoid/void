import type * as V from '../../engine/index.ts'
import type {LoadConfig, LoadLevel, LoadTileset} from '../ents/ent.ts'
import type {
  LoadConfigSchema,
  LoadLevelSchema,
  LoadTilesetSchema
} from '../level/level-schema.ts'
// biome-ignore lint/correctness/useJsonImportAttributes:;
import type tags from '../level/tags.json'
import type {Tmp} from '../storage/tmp.ts'

declare module '../../engine/index.ts' {
  interface Ent {
    loadConfig?: LoadConfig
    loadLevel?: LoadLevel
    loadTileset?: LoadTileset
  }

  interface EntSchema {
    loadConfig?: LoadConfigSchema
    loadLevel?: LoadLevelSchema
    loadTileset?: LoadTilesetSchema
  }

  // to-do: why is this necessary? it totally sucks.
  interface Loader {
    levelTiles?: V.LevelTiles
    tilesetImg?: HTMLImageElement
    /** index of the currently selected tile in the tileset. */
    tile: number
    tmp: Tmp
    loadConfig(v: V.Void): void
    loadLevel(v: V.Void): void
    loadTileset(v: V.Void): void
    saveTmp(): Promise<void>
    loadTmp(): Promise<void>
  }

  interface ReturnTag {
    // biome-ignore lint/style/useShorthandFunctionType:;
    (): keyof typeof tags.tags
  }
}
