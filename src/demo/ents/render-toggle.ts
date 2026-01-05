import * as V from '../../index.ts'

export type RenderToggleEnt = V.SysEnt<RenderToggleSys>

export class RenderToggleSys implements V.Sys {
  readonly query = 'button & renderToggle & sprite'

  update(ent: RenderToggleEnt, v: V.Void): void {
    // to-do: move under Void helper methods and hide zoo? same for other APIs.
    v.renderer.always = V.buttonOn(ent)
  }
}
