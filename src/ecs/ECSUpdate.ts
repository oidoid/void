import { I16, I16Box, NumberXY, U16XY } from '@/oidlib';
import { InputState, InstanceBuffer, RendererStateMachine } from '@/void';

export interface ECSUpdate {
  readonly inputs: Readonly<InputState>;
  readonly time: number;
  readonly camBounds: Readonly<I16Box>;
  readonly instanceBuffer: InstanceBuffer;
  readonly clientViewportWH: Readonly<NumberXY>;
  readonly nativeViewportWH: Readonly<U16XY>;
  readonly delta: number;
  readonly rendererStateMachine: RendererStateMachine;
  readonly scale: I16;
  pickHandled?: boolean;
}
