import type {OpenFile, TilePicker} from '../ents/ent.ts'
import type {OpenFileSchema, TilePickerSchema} from '../level/level-schema.ts'
// biome-ignore lint/correctness/useJsonImportAttributes:;
import type tags from '../level/tags.json'

declare module '../../engine/index.ts' {
  interface Ent {
    openFile?: OpenFile
    tilePicker?: TilePicker
  }

  interface EntSchema {
    openFile?: OpenFileSchema
    tilePicker?: TilePickerSchema
  }

  interface ReturnTag {
    // biome-ignore lint/style/useShorthandFunctionType:;
    (): keyof typeof tags.tags
  }
}
