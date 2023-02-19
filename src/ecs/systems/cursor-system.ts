import { CursorFilmSet, QueryToEnt, RunState, Sprite, System } from '@/void'

export type CursorEnt = QueryToEnt<
  { cursor: CursorFilmSet; sprite: Sprite },
  typeof query
>

const query = 'cursor & sprite'

export class CursorSystem implements System<CursorEnt> {
  readonly query = query

  runEnt(ent: CursorEnt, state: RunState<CursorEnt>): void {
    const { cursor, sprite } = ent
    if (state.input.isOnStart('Action')) {
      sprite.animate(state.time, cursor.pick)
    } else if (state.input.isOffStart('Action')) {
      sprite.animate(state.time, cursor.point)
    }
  }
}
