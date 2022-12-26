import { I16XY, I32 } from '@/oidlib';
import { PointerType } from '@/void';

export interface PointerInput {
  readonly buttons: I32;
  /** The event creation timestamp. */
  readonly created: DOMHighResTimeStamp;
  /** How long the button state has persisted. 0 (triggered) on state change. */
  readonly duration: number;
  /** The encoded PointerButtons. */
  readonly pointerType: PointerType;
  /** When the onEvent() listener was invoked. */
  readonly received: DOMHighResTimeStamp;
  /** The level position. */
  readonly xy: I16XY;
}
