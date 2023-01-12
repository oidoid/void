import { CursorFilmSet, ECSUpdate, Sprite, System } from '@/void';

export interface CursorSet {
  readonly cursor: CursorFilmSet;
  readonly sprite: Sprite;
}

export class CursorSystem implements System<CursorSet> {
  readonly query = new Set(['cursor', 'sprite'] as const);

  updateEnt(set: CursorSet, update: ECSUpdate): void {
    const { cursor, sprite } = set;
    if (update.input.isOnStart('Action')) {
      sprite.animate(update.time, cursor.pick);
    } else if (update.input.isOffStart('Action')) {
      sprite.animate(update.time, cursor.point);
    }
  }
}
