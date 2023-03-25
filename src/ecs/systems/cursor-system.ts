import { CursorFilmSet, Game, Layer, QueryEnt, Sprite, System } from '@/void'

export type CursorEnt = QueryEnt<
  { cursor: CursorFilmSet; sprite: Sprite },
  typeof query
>

const query = 'cursor & sprite'

export class CursorSystem implements System<CursorEnt> {
  readonly query = query

  runEnt(ent: CursorEnt, game: Game<CursorEnt>): void {
    if (game.input.isOnStart('Action')) {
      ent.sprite.animate(game.time, ent.cursor.pick)
    } else if (game.input.isOffStart('Action')) {
      ent.sprite.animate(game.time, ent.cursor.point)
    }

    if (
      game.input.xy != null || // Pointer moved.
      // Directional button movement.
      game.input.isAnyOnStart('Left', 'Right', 'Up', 'Down')
    ) setLayer(ent.sprite, game)
  }
}

function setLayer(sprite: Sprite, game: Game<CursorEnt>): void {
  if (game.input.pointerType == null || game.input.pointerType === 'Mouse') {
    sprite.layer = Layer.Cursor
  } else if (
    game.input.pointerType === 'Pen' || game.input.pointerType === 'Touch'
  ) sprite.layer = Layer.Bottom
}
