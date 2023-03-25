import { I16 } from '@/ooz'
import { Game, QueryEnt, Sprite, System } from '@/void'

export type FollowPointEnt = QueryEnt<
  { followPoint: Record<never, never>; sprite: Sprite },
  typeof query
>

const query = 'followPoint & sprite'

export class FollowPointSystem implements System<FollowPointEnt> {
  readonly query = query
  runEnt(ent: FollowPointEnt, game: Game<FollowPointEnt>): void {
    if (game.input.xy != null) ent.sprite.moveTo(game.input.xy)
    else {
      // to-do: limit to screen area if ent says so.
      const speed = I16.clamp(Math.max(1, game.tick / 4)) // to-do: move speed to ent.
      if (game.input.isOn('Left')) ent.sprite.moveBy(-speed, 0)
      if (game.input.isOn('Right')) ent.sprite.moveBy(speed, 0)
      if (game.input.isOn('Up')) ent.sprite.moveBy(0, -speed)
      if (game.input.isOn('Down')) ent.sprite.moveBy(0, speed)
    }
  }
}
