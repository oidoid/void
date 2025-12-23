import * as V from '../../index.ts'
import type {Game} from '../game.ts'
import type {Tag} from '../types/tag.ts'

export type RenderToggleEnt = V.QueryEnt<Tag, RenderToggleSys['query']>

export class RenderToggleSys implements V.Sys<Tag> {
  readonly query = 'button & renderToggle & sprite' as const

  update(ent: RenderToggleEnt, v: Game): void {
    v.renderer.always = V.buttonOn(ent)
  }
}
