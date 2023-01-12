import { Cam, Input, InstanceBuffer, RendererStateMachine } from '@/void';

export interface ECSUpdate {
  readonly input: Readonly<Input>;
  /** The running age in milliseconds. */
  readonly time: number;
  /** The update step duration in milliseconds. */
  readonly tick: number;
  readonly cam: Readonly<Cam>;
  readonly instanceBuffer: InstanceBuffer;
  readonly rendererStateMachine: RendererStateMachine;
  pickHandled?: boolean;
}
