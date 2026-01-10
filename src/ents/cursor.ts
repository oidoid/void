import {Layer} from '../graphics/layer.ts'
import {floorDrawEpsilon} from '../graphics/sprite.ts'
import type {Input, Point} from '../input/input.ts'
import type {Secs} from '../types/time.ts'
import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'

//  to-do: i do pass ent data here. maybe I should do that for mem pool as SpritePool(i).

/**
 * writes to sprite XYZ and tag, invalid.
 *
 * update this ent first.  always prefer testing against cursor, not input, in
 * other ents. the cursor may be moved by keyboard and has a hitbox.
 */
export type CursorEnt = HookEnt<CursorHook>

export class CursorHook implements Hook {
  readonly query = 'cursor & sprite'

  update(ent: CursorEnt, v: Void): void {
    if (v.input.point?.invalid) onPoint(ent, v.input.point)

    // assume the sprite dimensions don't vary between point and pick. always
    // update in case cam invalidates while keyboard is temporarily off.
    updateBounds(ent, v)

    if (
      ent.cursor.keyboard &&
      (v.input.dir.x ||
        v.input.dir.y ||
        (!v.input.point && v.input.isAnyStarted('A')))
    )
      onKey(ent, v.input, v.tick.s)

    if (ent.cursor.pick) {
      const tag = v.input.isOn('A') ? ent.cursor.pick : ent.cursor.point
      if (tag !== ent.sprite.tag) {
        ent.sprite.tag = tag
        ent.invalid = true
      }
    }
  }
}

/** @internal */
export function onKey(ent: CursorEnt, input: Input, tick: Secs): void {
  const len = floorDrawEpsilon(ent.cursor.keyboard * tick)

  if (input.isAnyOnStart('U', 'D', 'L', 'R') && input.dir.x && input.dir.y)
    ent.sprite.diagonalize(input.dir)

  if (input.dir.x)
    ent.sprite.x = Math.min(
      ent.cursor.bounds.x + ent.cursor.bounds.w,
      Math.max(ent.cursor.bounds.x, ent.sprite.x + input.dir.x * len)
    )
  if (input.dir.y)
    ent.sprite.y = Math.min(
      ent.cursor.bounds.y + ent.cursor.bounds.h,
      Math.max(ent.cursor.bounds.y, ent.sprite.y + input.dir.y * len)
    )
  ent.sprite.z = Layer.Top
  ent.sprite.hidden = false
  ent.invalid = true
}

/** @internal */
export function onPoint(
  ent: CursorEnt,
  point: Readonly<Pick<Point, 'local' | 'click' | 'type'>>
): void {
  ent.sprite.x = point.local.x
  ent.sprite.y = point.local.y
  ent.sprite.z = Layer.Top
  ent.sprite.hidden = point.type !== 'Mouse'
  ent.invalid = true
}

function updateBounds(ent: CursorEnt, v: Void): void {
  if (!v.cam.invalid) return
  ent.cursor.bounds.x = -ent.sprite.w
  ent.cursor.bounds.y = -ent.sprite.h
  ent.cursor.bounds.w = v.cam.w + ent.sprite.w
  ent.cursor.bounds.h = v.cam.h + ent.sprite.h
}
