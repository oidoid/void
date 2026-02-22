import * as V from '../../engine/index.ts'

/** writes to sprite hidden; and overlay sprites XY, hidden. */
export type MouseEnt = V.HookEnt<MouseHook>

export class MouseHook implements V.Hook {
  readonly query = 'hud & mouse & sprite'

  update(ent: MouseEnt, v: V.Void): void {
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
      updateOverlay(ent.sprite, ent.mouse.primary, v.input.isOn('A'))
      updateOverlay(ent.sprite, ent.mouse.secondary, v.input.isOn('B'))
      updateOverlay(ent.sprite, ent.mouse.tertiary, v.input.isOn('C'))
      updateOverlay(
        ent.sprite,
        ent.mouse.locked,
        v.input.pointer.locked // to-do: confusing to have pointer and point separately.
      )
    } else {
      ent.mouse.primary.hidden = true
      ent.mouse.secondary.hidden = true
      ent.mouse.tertiary.hidden = true
      ent.mouse.locked.hidden = true
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
