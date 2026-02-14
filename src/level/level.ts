import type {Zoo} from '../ents/zoo.ts'
import type {LevelTiles} from '../graphics/tileset.ts'
import type {WH} from '../types/geo.ts'

export type Level = {
  background: number | undefined
  tiles: LevelTiles | undefined
  // to-do: cam: {minWH: WH, minScale: number, zoomOut: number}.
  minWH: WH | undefined
  minScale: number | undefined
  zoo: Zoo
  zoomOut: number | undefined
}
