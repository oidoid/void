import { I16Box, I16XY, NumberXY } from '@/oidlib';
import {
  GamepadPoller,
  KeyboardPoller,
  PointerPoller,
  PointerType,
} from '@/void';

export class InputPoller {
  readonly #gamepad: GamepadPoller = new GamepadPoller();
  readonly #keyboard: KeyboardPoller = new KeyboardPoller();
  readonly #pointer: PointerPoller = new PointerPoller();

  get pointerType(): PointerType | undefined {
    return this.#pointer.pointerType;
  }

  get sample(): bigint {
    return this.#gamepad.sample | this.#keyboard.sample | this.#pointer.sample;
  }

  get xy(): Readonly<I16XY> | undefined {
    return this.#pointer.xy;
  }

  preupdate(): void {
    this.#gamepad.preupdate();
  }

  postupdate(
    clientViewportWH: Readonly<NumberXY>, // to-do: branding?
    cam: Readonly<I16Box>,
  ): void {
    this.#pointer.postupdate(clientViewportWH, cam);
  }

  register(op: 'add' | 'remove'): void {
    this.#keyboard.register(op);
    this.#pointer.register(op);
  }

  reset(): void {
    this.#gamepad.reset();
    this.#keyboard.reset();
    this.#pointer.reset();
  }
}
