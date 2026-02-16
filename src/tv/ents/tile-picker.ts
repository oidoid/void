import * as V from '../../engine/index.ts'

export type TilePickerEnt = V.HookEnt<TilePickerHook>

/** cycles through available tileset tiles on click. */
export class TilePickerHook implements V.Hook {
  readonly query = 'button & tilePicker & sprite'

  update(ent: TilePickerEnt, v: V.Void): void {
    if (!V.buttonOn(ent)) return
    v.invalid = true
  }
}
