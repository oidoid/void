import { Immutable } from '@/oidlib';
import { CursorFilmSet, ECSUpdate, Layer, Sprite, System } from '@/void';

export interface CursorSet {
  readonly cursor: CursorFilmSet;
  readonly sprite: Sprite;
}

export const CursorSystem: System<CursorSet> = Immutable({
  query: new Set(['cursor', 'sprite']),
  updateEnt,
});

function updateEnt(set: CursorSet, update: ECSUpdate): void {
  const { cursor, sprite } = set;
  if (
    update.input.pointerType == 'Pen' || update.input.pointerType == 'Touch'
  ) sprite.layer = Layer.Bottom;
  else if (update.input.pointerType == 'Mouse') sprite.layer = Layer.Cursor;

  if (update.input.isOn('Action')) {
    if (update.input.isOnStart('Action')) {
      sprite.animate(update.time, cursor.pick);
    }
  } else sprite.animate(update.time, cursor.point);
}
