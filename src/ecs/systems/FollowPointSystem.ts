import { Sprite, System } from '@/void';
import { I16Box, Immutable, NonNull } from '@/oidlib';
import { ECSUpdate } from '../ECSUpdate.ts';

export interface FollowPointSet {
  readonly followPoint: Record<never, never>;
  readonly sprite: Sprite;
}

export const FollowPointSystem: System<FollowPointSet> = Immutable({
  query: new Set(['followPoint', 'sprite']),
  skip,
  updateEnt,
});

function skip(update: ECSUpdate): boolean {
  return update.inputs.point?.active != true;
}

function updateEnt(set: FollowPointSet, update: ECSUpdate): void {
  const { sprite } = set;
  I16Box.moveTo(sprite.bounds, NonNull(update.inputs.point).xy);
}
