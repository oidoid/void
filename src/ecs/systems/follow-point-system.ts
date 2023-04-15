import { Game, QueryEnt, Sprite, System } from '@/void'

export type FollowPointEnt = QueryEnt<
  { followPoint: Record<never, never>; sprites: [Sprite, ...Sprite[]] },
  typeof query
>

const query = 'followPoint & sprites'

export class FollowPointSystem implements System<FollowPointEnt> {
  readonly query = query
  runEnt(ent: FollowPointEnt, game: Game<FollowPointEnt>): void {
    if (game.input.xy != null) ent.sprites[0].setXY(game.input.xy)
  }
}
