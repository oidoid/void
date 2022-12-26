import { I16Box, Immutable, NonNull } from '@/oidlib';
import { Sprite, System } from '@/void';
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
  return !update.pointer.on('Point');
}

function updateEnt(set: FollowPointSet, update: ECSUpdate): void {
  I16Box.moveTo(set.sprite.bounds, NonNull(update.pointer.xy));
}
