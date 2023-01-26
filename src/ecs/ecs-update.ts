import { Random } from '@/oidlib';
import { Cam, Input, InstanceBuffer, RendererStateMachine } from '@/void';

export interface ECSUpdate {
  readonly input: Readonly<Input>;
  /** The running age in milliseconds. */
  readonly time: number;
  /**
   * The exact duration in milliseconds to apply each update step. Any number
   * of updates may occur per animation frame.
   */
  readonly tick: number;
  readonly cam: Readonly<Cam>;
  readonly instanceBuffer: InstanceBuffer;
  readonly rendererStateMachine: RendererStateMachine;
  pickHandled?: boolean;
  random: Random;
}
