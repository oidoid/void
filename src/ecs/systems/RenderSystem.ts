import { Immutable } from '@/oidlib';
import { InstanceBuffer, Renderer, Sprite, System } from '@/void';
import { ECSUpdate } from '../ECSUpdate.ts';

interface RenderSet {
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
    InstanceBuffer.set(update.instanceBuffer, index, set.sprite, update.time);
    index++;
  }

  Renderer.render(
    update.rendererStateMachine.renderer,
    update.time,
    update.scale,
    update,
    update.camBounds,
    update.instanceBuffer,
  );
}
