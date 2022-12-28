import { I32 } from '@/oidlib';
import { DeviceInput, Direction } from '@/void';

export class KeyboardDirectionInput extends DeviceInput<Direction> {
  /** The event creation timestamp. */
  readonly created: DOMHighResTimeStamp;
  /**
   * Logical state of gamepad directional buttons. The original encoding is
   * not preserved. These should only ever be Direction.toBit flags.
   */
  readonly directions: I32;
  /** When the onEvent() listener was invoked. */
  readonly received: DOMHighResTimeStamp;

  constructor(
    duration: number,
    created: DOMHighResTimeStamp,
    directions: I32,
    received: DOMHighResTimeStamp,
  ) {
    super(duration);
    this.directions = directions;
    this.created = created;
    this.received = received;
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
