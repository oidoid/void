import { Game, QueryEnt, Sprite, System } from '@/void'

export type FollowDpadEnt = QueryEnt<
  { followDpad: Record<never, never>; sprites: [Sprite, ...Sprite[]] },
  typeof query
>

const query = 'followDpad & sprites'

export class FollowDpadSystem implements System<FollowDpadEnt> {
  readonly query = query
  runEnt(ent: FollowDpadEnt, game: Game<FollowDpadEnt>): void {
    // to-do: limit to screen area if ent says so.
    const speed = game.tick / 4 // to-do: move speed to ent.
    let { x, y } = ent.sprites[0]
    if (game.input.isOn('Left')) x -= speed
    if (game.input.isOn('Right')) x += speed
    if (game.input.isOn('Up')) y -= speed
    if (game.input.isOn('Down')) y += speed
    ent.sprites[0].setXY(x, y)
  }
}
