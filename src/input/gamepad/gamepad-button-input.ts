import { I32 } from '@/oidlib';
import { Button, DeviceInput } from '@/void';

export class GamepadButtonInput extends DeviceInput<Button> {
  /**
   * Logical state of gamepad nondirectional buttons. The original encoding is
   * not preserved. These should only ever be Button.toBit flags.
   */
  readonly buttons: I32;

  constructor(duration: number, buttons: I32) {
    super(duration);
    this.buttons = buttons;
  }

  isOn(button: Button): boolean {
    const mask = Button.toBit[button];
    return (this.buttons & mask) == mask;
  }

  protected override isStart(button: Button, last: this): boolean {
    const mask = Button.toBit[button];
    return this.duration == 0 && (this.buttons & mask) != (last.buttons & mask);
  }
}
