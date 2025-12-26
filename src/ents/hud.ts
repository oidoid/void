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
import type {Sys, SysEnt} from './sys.ts'

export type HUDEnt = SysEnt<HUDSys>

/** reads invalid, hud, sprite WH and z; writes invalid, sprite XY, WH. */
export class HUDSys implements Sys {
  readonly query = 'hud & sprite'

  update(ent: HUDEnt, v: Void): void {
    if (!ent.invalid && !v.cam.invalid) return
    const follow = v.cam.follow(
      ent.sprite,
      ent.sprite.z,
      ent.hud.origin,
      ent.hud
    )
    boxAssign(ent.sprite, follow)
    ent.invalid = true // to-do: unclear if having wrappers for uniformly like
    //  textSetText() is worth it.
  }
}

export function hudSetFill(
  ent: HUDEnt,
  fill: 'X' | 'Y' | 'XY' | undefined
): void {
  if (ent.hud.fill === fill) return
  ent.hud.fill = fill
  ent.invalid = true
}

export function hudSetMargin(ent: HUDEnt, margin: Readonly<Border>): void {
  if (borderEq(ent.hud.margin, margin)) return
  borderAssign(ent.hud.margin, margin)
  ent.invalid = true
}

export function hudSetModulo(ent: HUDEnt, modulo: Readonly<XY>): void {
  if (xyEq(ent.hud.modulo, modulo)) return
  xyAssign(ent.hud.modulo, modulo)
  ent.invalid = true
}

export function hudSetOrigin(ent: HUDEnt, origin: CompassDir): void {
  if (ent.hud.origin === origin) return
  ent.hud.origin = origin
  ent.invalid = true
}
