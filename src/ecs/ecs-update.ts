import { Cam, Input, InstanceBuffer, RendererStateMachine } from '@/void';

export interface ECSUpdate {
  readonly input: Readonly<Input>;
  readonly time: number;
  readonly cam: Readonly<Cam>;
  readonly instanceBuffer: InstanceBuffer;
  readonly delta: number;
  readonly rendererStateMachine: RendererStateMachine;
  pickHandled?: boolean;
}
