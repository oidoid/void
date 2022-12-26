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
    update.pointer.pointerType == 'Pen' ||
    update.pointer.pointerType == 'Touch'
  ) sprite.layer = Layer.Bottom;
  else sprite.layer = Layer.Cursor;

  if (update.pointer.on('ClickPrimary')) {
    if (update.pointer.onTriggered('ClickPrimary')) {
      sprite.animate(update.time, cursor.pick);
    }
  } else sprite.animate(update.time, cursor.point);
}
