import { I16, I16XY, Immutable } from '@/oidlib';
import { ECSUpdate, Sprite, System } from '@/void';

export interface FollowPointSet {
  readonly followPoint: Record<never, never>;
  readonly sprite: Sprite;
}

export const FollowPointSystem: System<FollowPointSet> = Immutable({
  query: new Set(['followPoint', 'sprite']),
  updateEnt,
});

function updateEnt(set: FollowPointSet, update: ECSUpdate): void {
  const { sprite } = set;

  if (update.input.xy != null) sprite.moveTo(update.input.xy);
  else {
    // to-do: limit to screen area.
    // to-do: pass tick in.
    const tick = 1000 / 60;
    const speed = I16.trunc(Math.max(1, (update.delta / tick) * 4));
    if (update.input.isOn('Left')) sprite.moveBy(I16XY(-speed, 0));
    if (update.input.isOn('Right')) sprite.moveBy(I16XY(speed, 0));
    if (update.input.isOn('Up')) sprite.moveBy(I16XY(0, -speed));
    if (update.input.isOn('Down')) sprite.moveBy(I16XY(0, speed));
  }
}
