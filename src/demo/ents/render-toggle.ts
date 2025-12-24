import * as V from '../../index.ts'

export type RenderToggleEnt = V.QueryEnt<RenderToggleSys['query']>

export class RenderToggleSys implements V.Sys {
  readonly query = 'button & renderToggle & sprite' as const

  update(ent: RenderToggleEnt, v: V.Void): void {
    v.renderer.always = V.buttonOn(ent)
  }
}
