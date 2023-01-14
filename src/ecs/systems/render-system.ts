import { Immutable } from '@/oidlib';
import { ECSUpdate, Sprite, System } from '@/void';

export interface RenderSet {
  readonly sprite: Sprite;
}

export const RenderSystem: System<RenderSet> = Immutable({
  type: 'Render',
  query: new Set(['sprite']),
  update,
});

function update(sets: Set<RenderSet>, update: ECSUpdate): void {
  let index = 0;
  for (const set of sets.values()) {
    update.instanceBuffer.set(index, set.sprite, update.time);
    index++;
  }

  update.rendererStateMachine.render(
    update.time,
    update.cam,
    update.instanceBuffer,
  );
}
