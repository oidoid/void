import { Immutable } from '@/oidlib';
import {
  Button,
  CursorFilmSet,
  ECSUpdate,
  Input,
  Layer,
  Sprite,
  System,
} from '@/void';

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
    update.inputs.point?.pointerType == 'Pen' ||
    update.inputs.point?.pointerType == 'Touch'
  ) sprite.layer = Layer.Bottom;
  else sprite.layer = Layer.Cursor;

  if (
    update.inputs.pick?.active == true &&
    (update.inputs.pick.buttons & Button.Primary) == Button.Primary
  ) {
    if (Input.activeTriggered(update.inputs.pick)) {
      sprite.animate(update.time, cursor.pick);
    }
  } else sprite.animate(update.time, cursor.point);
}
