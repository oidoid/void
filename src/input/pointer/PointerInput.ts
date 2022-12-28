import { I16XY, I32 } from '@/oidlib';
import { DeviceInput, PointerType } from '@/void';
import { Button } from '../button.ts';

export class PointerInput extends DeviceInput<Button> {
  /**
   * Logical state of gamepad nondirectional buttons. The original encoding is
   * not preserved. These should only ever be Button.toBit flags.
   */
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

  isOn(direction: Button): boolean {
    const mask = Button.toBit[direction];
    return (this.buttons & mask) == mask;
  }

  protected override isStart(button: Button, last: this): boolean {
    const mask = Button.toBit[button];
    return this.duration == 0 && (this.buttons & mask) != (last.buttons & mask);
  }
}
