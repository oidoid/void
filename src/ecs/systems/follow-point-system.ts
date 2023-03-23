import { I16, I16XY } from '@/ooz'
import { Game, Layer, QueryEnt, Sprite, System } from '@/void'

export type FollowPointEnt = QueryEnt<
  { followPoint: Record<never, never>; sprite: Sprite },
  typeof query
>

const query = 'followPoint & sprite'

export class FollowPointSystem implements System<FollowPointEnt> {
  readonly query = query
  runEnt(ent: FollowPointEnt, game: Game<FollowPointEnt>): void {
    const { sprite } = ent

    if (game.input.xy != null) {
      sprite.moveTo(game.input.xy)
      setCursorLayer(sprite, game)
    } else {
      // to-do: limit to screen area.
      const speed = I16.clamp(Math.max(1, game.tick / 4))
      if (game.input.isOn('Left')) sprite.moveBy(new I16XY(-speed, 0)) // to-do: support XYArgs here.
      if (game.input.isOn('Right')) sprite.moveBy(new I16XY(speed, 0))
      if (game.input.isOn('Up')) sprite.moveBy(new I16XY(0, -speed))
      if (game.input.isOn('Down')) sprite.moveBy(new I16XY(0, speed))
      if (game.input.isAnyOn('Left', 'Right', 'Up', 'Down')) {
        setCursorLayer(sprite, game)
      }
    }
  }
}

function setCursorLayer(sprite: Sprite, game: Game<FollowPointEnt>): void {
  if (game.input.pointerType == null || game.input.pointerType == 'Mouse') {
    sprite.layer = Layer.Cursor
  } else if (
    game.input.pointerType == 'Pen' || game.input.pointerType == 'Touch'
  ) sprite.layer = Layer.Bottom
}
