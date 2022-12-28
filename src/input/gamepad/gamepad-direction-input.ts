import { I32 } from '@/oidlib';
import { DeviceInput, Direction } from '@/void';

export class GamepadDirectionInput extends DeviceInput<Direction> {
  /**
   * Logical state of gamepad directional buttons. The original encoding is
   * not preserved. These should only ever be Direction.toBit flags.
   */
  readonly directions: I32;

  constructor(duration: number, directions: I32) {
    super(duration);
    this.directions = directions;
  }

  isOn(direction: Direction): boolean {
    const mask = Direction.toBit[direction];
    return (this.directions & mask) == mask;
  }

  protected override isStart(button: Direction, last: this): boolean {
    const mask = Direction.toBit[button];
    return this.duration == 0 &&
      (this.directions & mask) != (last.directions & mask);
  }
}
