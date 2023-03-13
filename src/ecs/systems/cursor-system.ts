import { CursorFilmSet, Game, QueryEnt, Sprite, System } from '@/void'

export type CursorEnt = QueryEnt<
  { cursor: CursorFilmSet; sprite: Sprite },
  typeof query
>

const query = 'cursor & sprite'

export class CursorSystem implements System<CursorEnt> {
  readonly query = query

  runEnt(ent: CursorEnt, game: Game<CursorEnt>): void {
    const { cursor, sprite } = ent
    if (game.input.isOnStart('Action')) {
      sprite.animate(game.time, cursor.pick)
    } else if (game.input.isOffStart('Action')) {
      sprite.animate(game.time, cursor.point)
    }
  }
}
