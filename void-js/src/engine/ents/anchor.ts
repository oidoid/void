import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'
import {zooFindByID} from './zoo.ts'

export type AnchorEnt = HookEnt<AnchorHook>

/** reads invalid, anchor, sprite WH; writes invalid, sprite XY. */
export class AnchorHook implements Hook {
  readonly query = 'anchor & sprite'

  update(ent: AnchorEnt, v: Void): void {
    ent.anchor.ref ??= zooFindByID(v.loader.zoo.default, ent.anchor.id)
    const anchor = ent.anchor.ref
    if (!anchor?.sprite || (!ent.invalid && anchor.invalid < v.tick.start))
      return

    let x = anchor.sprite.x
    let y = anchor.sprite.y

    switch (ent.anchor.dir) {
      case 'W':
      case 'SW':
        x = anchor.sprite.x - ent.sprite.w - ent.anchor.margin.x
        break
      case 'E':
      case 'SE':
        x = anchor.sprite.x + anchor.sprite.w + ent.anchor.margin.x
        break
      case 'NE':
        x = anchor.sprite.x + anchor.sprite.w - ent.sprite.w
        break
      case 'NW':
        x = anchor.sprite.x
        break
      case 'N':
      case 'S':
      case 'Center':
        x = anchor.sprite.x + Math.trunc((anchor.sprite.w - ent.sprite.w) / 2)
        break
    }

    switch (ent.anchor.dir) {
      case 'N':
      case 'NE':
      case 'NW':
        y = anchor.sprite.y - ent.sprite.h - ent.anchor.margin.y
        break
      case 'S':
        y = anchor.sprite.y + anchor.sprite.h + ent.anchor.margin.y
        break
      case 'SE':
      case 'SW':
        y =
          anchor.sprite.y + anchor.sprite.h - ent.sprite.h - ent.anchor.margin.y
        break
      case 'W':
      case 'E':
      case 'Center':
        y = anchor.sprite.y + Math.trunc((anchor.sprite.h - ent.sprite.h) / 2)
        break
    }

    ent.sprite.x = x
    ent.sprite.y = y
    ent.invalid = v.tick.start
  }
}
