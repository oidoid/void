import * as V from '../../engine/index.ts'

/** writes to sprite hidden; and overlay sprites XY, hidden. */
export type MouseStatusEnt = V.HookEnt<MouseStatusHook>

export class MouseStatusHook implements V.Hook {
  readonly query = 'hud & mouseStatus & sprite'

  update(ent: MouseStatusEnt, v: V.Void): void {
    if (
      !ent.invalid &&
      !v.cam.invalid &&
      !v.input.invalid &&
      !v.input.point?.invalid
    )
      return

    const active =
      v.input.point?.type === 'Mouse' ||
      (v.loader.cursor && V.cursorIsVisible(v.loader.cursor))
    ent.sprite.hidden = !active

    if (active) {
      updateOverlay(ent.sprite, ent.mouseStatus.primary, v.input.isOn('A'))
      updateOverlay(ent.sprite, ent.mouseStatus.secondary, v.input.isOn('B'))
      updateOverlay(ent.sprite, ent.mouseStatus.tertiary, v.input.isOn('C'))
      updateOverlay(
        ent.sprite,
        ent.mouseStatus.locked,
        v.input.pointer.locked // to-do: confusing to have pointer and point separately.
      )
    } else {
      ent.mouseStatus.primary.hidden = true
      ent.mouseStatus.secondary.hidden = true
      ent.mouseStatus.tertiary.hidden = true
      ent.mouseStatus.locked.hidden = true
    }

    ent.invalid = true
  }
}

function updateOverlay(base: V.Sprite, overlay: V.Sprite, on: boolean): void {
  overlay.x = base.x
  overlay.y = base.y
  overlay.z = V.layerOffset(base.z, 1)
  overlay.hidden = !on
}
