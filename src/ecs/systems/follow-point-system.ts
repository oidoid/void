import { Game, QueryEnt, Sprite, System } from '@/void'

export type FollowPointEnt = QueryEnt<
  { followPoint: Record<never, never>; sprite: Sprite },
  typeof query
>

const query = 'followPoint & sprite'

export class FollowPointSystem implements System<FollowPointEnt> {
  readonly query = query
  runEnt(ent: FollowPointEnt, game: Game<FollowPointEnt>): void {
    if (game.input.xy != null) ent.sprite.xy.set(game.input.xy)
    else {
      // to-do: limit to screen area if ent says so.
      const speed = game.tick / 4 // to-do: move speed to ent.
      if (game.input.isOn('Left')) ent.sprite.x -= speed
      if (game.input.isOn('Right')) ent.sprite.x += speed
      if (game.input.isOn('Up')) ent.sprite.y -= speed
      if (game.input.isOn('Down')) ent.sprite.y += speed
    }
  }
}
