import { I32 } from '@/oidlib';
import { Button, DeviceInput } from '@/void';

export class KeyboardButtonInput extends DeviceInput<Button> {
  /**
   * Logical state of gamepad nondirectional buttons. The original encoding is
   * not preserved. These should only ever be Button.toBit flags.
   */
  readonly buttons: I32;
  /** The event creation timestamp. */
  readonly created: DOMHighResTimeStamp;
  /** When the onEvent() listener was invoked. */
  readonly received: DOMHighResTimeStamp;

  constructor(
    duration: number,
    buttons: I32,
    created: DOMHighResTimeStamp,
    received: DOMHighResTimeStamp,
  ) {
    super(duration);
    this.buttons = buttons;
    this.created = created;
    this.received = received;
  }

  isOn(button: Button): boolean {
    const mask = Button.toBit[button];
    return (this.buttons & mask) == mask;
  }
}
