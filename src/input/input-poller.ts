import { I16Box, I16XY, NumberXY } from '@/oidlib';
import {
  Button,
  Direction,
  GamepadPoller,
  KeyboardPoller,
  PointerPoller,
  PointerType,
} from '@/void';

export class InputPoller {
  readonly #keyboard: KeyboardPoller;
  readonly #pad: GamepadPoller;
  readonly #pointer: PointerPoller;

  get pointerType(): PointerType {
    return this.#pointer.input.pointerType;
  }

  get xy(): I16XY {
    return this.#pointer.input.xy;
  }

  constructor() {
    this.#keyboard = new KeyboardPoller();
    this.#pad = new GamepadPoller();
    this.#pointer = new PointerPoller();
  }

  isOn(button: Button | Direction): boolean {
    if (Button.is(button)) {
      return this.#keyboard.button.isOn(button) ||
        this.#pointer.input.isOn(button) ||
        this.#pad.button.isOn(button);
    }
    if (Direction.is(button)) {
      return this.#keyboard.direction.isOn(button) ||
        this.#pad.direction.isOn(button);
    }
    return false;
  }

  isOnStart(button: Button | Direction): boolean {
    if (Button.is(button)) {
      return this.#keyboard.button.isOnStart(button, this.#keyboard.prevButton); //||
      // this.#pointer.input.isOnStart(button) ||
      // this.#pad.button.isOnStart(button);
    }
    if (Direction.is(button)) {
      return this.#keyboard.direction.isOnStart(
        button,
        this.#keyboard.prevDirection,
      ); //||
      // this.#pad.direction.isOnStart(button);
    }
    return false;
  }

  isOnHeld(button: Button | Direction): boolean {
    if (Button.is(button)) {
      return this.#keyboard.button.isOnHeld(button) ||
        this.#pointer.input.isOnHeld(button) ||
        this.#pad.button.isOnHeld(button);
    }
    if (Direction.is(button)) {
      return this.#keyboard.direction.isOnHeld(button) ||
        this.#pad.direction.isOnHeld(button);
    }
    return false;
  }

  isOff(button: Button | Direction): boolean {
    if (Button.is(button)) {
      return this.#keyboard.button.isOff(button) ||
        this.#pointer.input.isOff(button) ||
        this.#pad.button.isOff(button);
    }
    if (Direction.is(button)) {
      return this.#keyboard.direction.isOff(button) ||
        this.#pad.direction.isOff(button);
    }
    return true;
  }

  isOffStart(button: Button | Direction): boolean {
    if (Button.is(button)) {
      return this.#keyboard.button.isOffStart(
        button,
        this.#keyboard.prevButton,
      ); //||
      // this.#pointer.input.isOffStart(button) ||
      // this.#pad.button.isOffStart(button);
    }
    if (Direction.is(button)) {
      return this.#keyboard.direction.isOffStart(
        button,
        this.#keyboard.prevDirection,
      ); //||
      // this.#pad.direction.isOffStart(button);
    }
    return true;
  }

  isOffHeld(button: Button | Direction): boolean {
    if (Button.is(button)) {
      return this.#keyboard.button.isOffHeld(button) ||
        this.#pointer.input.isOffHeld(button) ||
        this.#pad.button.isOffHeld(button);
    }
    if (Direction.is(button)) {
      return this.#keyboard.direction.isOffHeld(button) ||
        this.#pad.direction.isOffHeld(button);
    }
    return true;
  }

  preupdate(navigator: Navigator): void {
    this.#pad.preupdate(navigator);
  }

  postupdate(
    delta: number,
    clientViewportWH: Readonly<NumberXY>,
    cam: Readonly<I16Box>,
  ): void {
    this.#keyboard.postupdate(delta);
    this.#pad.postupdate(delta);
    this.#pointer.postupdate(delta, clientViewportWH, cam);
  }

  register(window: Window, op: 'add' | 'remove'): void {
    this.#keyboard.register(window, op);
    this.#pointer.register(window, op);
  }
}
