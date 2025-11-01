import type {Anim} from '../graphics/atlas.ts'
import type {WH} from './geo.ts'

export type AtlasJSON = {
  anim: {[tag: string]: Anim}
  /**
   * cel source XY by `Anim.id` and `Anim.cel` for one cycle. truncated to
   * `animCels`.
   */
  celXY: number[]
}

export type GameConfig = {atlas?: AtlasJSON | undefined; init: InitConfig}

export type InitConfig = {
  background?: number | undefined
  input: 'Custom' | 'Default' | string
  /** undefined means infinite. */
  minWH: Partial<WH>
  minScale: number
  mode: 'Float' | 'Int' | string
  zoomOut: number
}
