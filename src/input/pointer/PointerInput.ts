import { I16XY, I32 } from '@/oidlib';
import { DeviceInput, PointerButton, PointerType } from '@/void';

export class PointerInput extends DeviceInput<PointerButton> {
  readonly buttons: I32;
  /** The event creation timestamp. */
  readonly created: DOMHighResTimeStamp;
  /** The encoded PointerButtons. */
  readonly pointerType: PointerType;
  /** When the onEvent() listener was invoked. */
  readonly received: DOMHighResTimeStamp;
  /** The level position. */
  readonly xy: I16XY;

  constructor(
    duration: number,
    buttons: I32,
    created: DOMHighResTimeStamp,
    pointerType: PointerType,
    received: DOMHighResTimeStamp,
    xy: I16XY,
  ) {
    super(duration);
    this.buttons = buttons;
    this.created = created;
    this.pointerType = pointerType;
    this.received = received;
    this.xy = xy;
  }

  isOn(direction: PointerButton): boolean {
    const mask = PointerButton.toBit[direction];
    return (this.buttons & mask) == mask;
  }
}
