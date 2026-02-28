import {
  type Border,
  borderAssign,
  borderEq,
  boxAssign,
  type CompassDir,
  type XY,
  xyAssign,
  xyEq
} from '../types/geo.ts'
import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'

export type HUDEnt = HookEnt<HUDHook>

/** reads invalid, hud, sprite WH and z; writes invalid, sprite XY, WH. */
export class HUDHook implements Hook {
  readonly query = 'hud & sprite'

  update(ent: HUDEnt, v: Void): void {
    if (ent.invalid < v.tick.start && !v.cam.invalid) return
    const follow = v.cam.follow(
      ent.sprite,
      ent.sprite.z,
      ent.hud.anchor,
      ent.hud
    )
    boxAssign(ent.sprite, follow)
    ent.invalid = v.tick.start // to-do: unclear if having wrappers for uniformly like
    //  textSetText() is worth it.
  }
}

export function hudSetFill(
  ent: HUDEnt,
  fill: 'X' | 'Y' | 'XY' | undefined
): void {
  if (ent.hud.fill === fill) return
  ent.hud.fill = fill
  ent.invalid = Infinity
}

export function hudSetMargin(ent: HUDEnt, margin: Readonly<Border>): void {
  if (borderEq(ent.hud.margin, margin)) return
  borderAssign(ent.hud.margin, margin)
  ent.invalid = Infinity
}

export function hudSetModulo(ent: HUDEnt, modulo: Readonly<XY>): void {
  if (xyEq(ent.hud.modulo, modulo)) return
  xyAssign(ent.hud.modulo, modulo)
  ent.invalid = Infinity
}

export function hudSetAnchor(ent: HUDEnt, anchor: CompassDir): void {
  if (ent.hud.anchor === anchor) return
  ent.hud.anchor = anchor
  ent.invalid = Infinity
}
