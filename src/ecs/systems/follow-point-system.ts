import { I16, I16XY } from '@/ooz'
import { Layer, QueryEnt, RunState, Sprite, System } from '@/void'

export type FollowPointEnt = QueryEnt<
  { followPoint: Record<never, never>; sprite: Sprite },
  typeof query
>

const query = 'followPoint & sprite'

export class FollowPointSystem implements System<FollowPointEnt> {
  readonly query = query
  runEnt(ent: FollowPointEnt, state: RunState<FollowPointEnt>): void {
    const { sprite } = ent

    if (state.input.xy != null) {
      sprite.moveTo(state.input.xy)
      setCursorLayer(sprite, state)
    } else {
      // to-do: limit to screen area.
      const speed = I16.trunc(Math.max(1, state.tick / 4))
      if (state.input.isOn('Left')) sprite.moveBy(new I16XY(-speed, 0)) // to-do: support XYArgs here.
      if (state.input.isOn('Right')) sprite.moveBy(new I16XY(speed, 0))
      if (state.input.isOn('Up')) sprite.moveBy(new I16XY(0, -speed))
      if (state.input.isOn('Down')) sprite.moveBy(new I16XY(0, speed))
      if (state.input.isAnyOn('Left', 'Right', 'Up', 'Down')) {
        setCursorLayer(sprite, state)
      }
    }
  }
}

function setCursorLayer(sprite: Sprite, state: RunState<FollowPointEnt>): void {
  if (state.input.pointerType == null || state.input.pointerType == 'Mouse') {
    sprite.layer = Layer.Cursor
  } else if (
    state.input.pointerType == 'Pen' || state.input.pointerType == 'Touch'
  ) sprite.layer = Layer.Bottom
}
