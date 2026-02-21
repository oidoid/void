import type {XY} from '../types/geo.ts'
import type {Hook, HookEnt} from './hook.ts'

export type NinePatchEnt = HookEnt<NinePatchHook>

/** reads invalid, sprite XY and WH; writes ninePatch, invalid. */
export class NinePatchHook implements Hook {
  readonly query = 'ninePatch & sprite'

  free(ent: NinePatchEnt): void {
    ninePatchFree(ent)
  }

  update(ent: NinePatchEnt): void {
    if (!ent.invalid) return
    const start = getStart(ent)
    setXYStart(ent, start)
    setWH(ent)
    setXYEnd(ent, start)
  }
}

export function ninePatchFree(ent: NinePatchEnt): void {
  ent.ninePatch.patch.w?.free()
  ent.ninePatch.patch.nw?.free()
  ent.ninePatch.patch.n?.free()
  ent.ninePatch.patch.ne?.free()
  ent.ninePatch.patch.e?.free()
  ent.ninePatch.patch.se?.free()
  ent.ninePatch.patch.s?.free()
  ent.ninePatch.patch.sw?.free()
  ent.ninePatch.patch.center?.free()
  ent.invalid = true
  // to-do: how to update zoo synchronously to remove the prop and not run update()?
}

function getStart(ent: Readonly<NinePatchEnt>): XY {
  const {sprite, ninePatch} = ent
  return {x: sprite.x + ninePatch.pad.w, y: sprite.y + ninePatch.pad.n}
}

/** @internal */
export function setWH(ent: NinePatchEnt): void {
  const {border, pad, patch} = ent.ninePatch

  const w = ent.sprite.w - border.w - border.e - pad.w - pad.e
  const h = ent.sprite.h - border.n - border.s - pad.n - pad.s
  if (patch.n) patch.n.w = w
  if (patch.s) patch.s.w = w
  if (patch.w) patch.w.h = h
  if (patch.e) patch.e.h = h
  if (patch.center) {
    patch.center.w = w
    patch.center.h = h
  }
}

/** @internal */
export function setXYEnd(
  ent: Readonly<NinePatchEnt>,
  start: Readonly<XY>
): void {
  const {patch, pad, border} = ent.ninePatch
  const end = {
    x: ent.sprite.x + ent.sprite.w - border.e - pad.e,
    y: ent.sprite.y + ent.sprite.h - border.s - pad.s
  }
  if (patch.ne) {
    patch.ne.x = end.x
    patch.ne.y = start.y
  }
  if (patch.e) {
    patch.e.x = end.x
    patch.e.y = start.y + border.n
  }
  if (patch.se) {
    patch.se.x = end.x
    patch.se.y = end.y
  }
  if (patch.s) {
    patch.s.x = start.x + border.w
    patch.s.y = end.y
  }
  if (patch.sw) {
    patch.sw.x = start.x
    patch.sw.y = end.y
  }
}

/** @internal */
export function setXYStart(ent: NinePatchEnt, start: Readonly<XY>): void {
  const {border, patch} = ent.ninePatch

  if (patch.nw) {
    patch.nw.x = start.x
    patch.nw.y = start.y
  }
  if (patch.w) {
    patch.w.x = start.x
    patch.w.y = start.y + border.n
  }
  if (patch.n) {
    patch.n.x = start.x + border.w
    patch.n.y = start.y
  }
  if (patch.center) {
    patch.center.x = start.x + border.w
    patch.center.y = start.y + border.n
  }
}
