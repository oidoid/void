import type {Anim} from '../graphics/atlas.ts'
import type {RenderMode} from '../graphics/render-mode.ts'
import type {InputMode} from '../input/input.ts'

export type AtlasJSON = {
  anim: {[tag: string]: Anim}
  /**
   * cel source XY by `Anim.id` and `Anim.cel` for one cycle. truncated to
   * `animCels`.
   */
  celXY: number[]
}

export type VoidConfig = {
  input: InputMode
  mode: RenderMode
  preload?: AtlasJSON
}
