import type {Anim} from '../graphics/atlas.ts'
import type {RenderMode} from '../graphics/render-mode.ts'
import type {InputMode} from '../input/input.ts'
import type {WH} from './geo.ts'

import './game-config-json.d.ts'

export type AtlasJSON = {
  anim: {[tag: string]: Anim}
  /**
   * cel source XY by `Anim.id` and `Anim.cel` for one cycle. truncated to
   * `animCels`.
   */
  celXY: number[]
}

export type GameConfig = {atlas?: AtlasJSON; init: InitConfig}

export type InitConfig = {
  background?: number
  input: InputMode
  /** undefined means infinite. */
  minWH?: Partial<WH>
  minScale: number
  mode: RenderMode
  zoomOut: number
}
