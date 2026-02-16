import type {Zoo} from '../ents/zoo.ts'
import type {LevelTiles} from '../graphics/tileset.ts'
import type {WH} from '../types/geo.ts'

export interface CamConfig {
  minScale: number | undefined
  minWH: WH | undefined
  x: number | undefined
  y: number | undefined
  zoomOut: number | undefined
}

export type Level = {
  background: number | undefined
  cam: CamConfig | undefined
  tiles: LevelTiles | undefined
  zoo: Zoo
}
