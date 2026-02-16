import type {TilePicker} from '../ents/ent.ts'
import type {TilePickerSchema} from '../level/level-schema.ts'
// biome-ignore lint/correctness/useJsonImportAttributes:;
import type tags from '../level/tags.json'

declare module '../../engine/index.ts' {
  interface Ent {
    tilePicker?: TilePicker
  }

  interface EntSchema {
    tilePicker?: TilePickerSchema
  }

  interface ReturnTag {
    // biome-ignore lint/style/useShorthandFunctionType:;
    (): keyof typeof tags.tags
  }

  interface ReturnTile {
    // biome-ignore lint/style/useShorthandFunctionType:;
    (): keyof typeof tags.tiles
  }
}
