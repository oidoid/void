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
  // to-do: this probably needs to check something more general like pointerType + input type so it doesn't flip on and off constantly
  if (
    update.input.pointerType == 'Pen' ||
    update.input.pointerType == 'Touch'
  ) sprite.layer = Layer.Bottom;
  else sprite.layer = Layer.Cursor;

  if (update.input.on('ActionPrimary')) {
    if (update.input.onStart('ActionPrimary')) {
      sprite.animate(update.time, cursor.pick);
    }
  } else sprite.animate(update.time, cursor.point);
}
