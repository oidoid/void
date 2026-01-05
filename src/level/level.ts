import type {Zoo} from '../ents/zoo.ts'
import type {WH} from '../types/geo.ts'

export type Level = {
  background: number | undefined
  minWH: WH | undefined
  minScale: number | undefined
  zoo: Zoo
  zoomOut: number | undefined
}
