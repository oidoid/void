import { I16Box, I16XY, NumberXY } from '@/oidlib';
import {
  Button,
  Direction,
  GamepadPoller,
  PointerPoller,
  PointerType,
} from '@/void';

export class InputPoller {
  #pad: GamepadPoller;
  #pointer: PointerPoller;

  get pointerType(): PointerType | undefined {
    return this.#pointer.input?.pointerType;
  }

  get xy(): I16XY | undefined {
    return this.#pointer.input?.xy;
  }

  constructor() {
    this.#pad = new GamepadPoller();
    this.#pointer = new PointerPoller();
  }

  isOn(button: Button | Direction): boolean {
    return Button.is(button) && this.#pointer.input?.isOn(button) ||
      Button.is(button) && this.#pad.button.isOn(button) ||
      Direction.is(button) && this.#pad.direction.isOn(button);
  }

  isOnStart(button: Button | Direction): boolean {
    return Button.is(button) &&
        this.#pointer.input?.isOnStart(button) ||
      Button.is(button) && this.#pad.button.isOnStart(button) ||
      Direction.is(button) && this.#pad.direction.isOnStart(button);
  }

  isOnHeld(button: Button | Direction): boolean {
    return Button.is(button) &&
        this.#pointer.input?.isOnHeld(button) ||
      Button.is(button) && this.#pad.button.isOnHeld(button) ||
      Direction.is(button) && this.#pad.direction.isOnHeld(button);
  }

  isOff(button: Button | Direction): boolean {
    return Button.is(button) && this.#pointer.input?.isOff(button) ||
      Button.is(button) && this.#pad.button.isOff(button) ||
      Direction.is(button) && this.#pad.direction.isOff(button);
  }

  isOffStart(button: Button | Direction): boolean {
    return Button.is(button) &&
        this.#pointer.input?.isOffStart(button) ||
      Button.is(button) && this.#pad.button.isOffStart(button) ||
      Direction.is(button) && this.#pad.direction.isOffStart(button);
  }

  isOffHeld(button: Button | Direction): boolean {
    return Button.is(button) && this.#pointer.input?.isOffHeld(button) ||
      Button.is(button) && this.#pad.button.isOffHeld(button) ||
      Direction.is(button) && this.#pad.direction.isOffHeld(button);
  }

  preupdate(navigator: Navigator): void {
    this.#pad.preupdate(navigator);
  }

  postupdate(
    delta: number,
    clientViewportWH: Readonly<NumberXY>,
    cam: Readonly<I16Box>,
  ): void {
    this.#pad.postupdate(delta);
    this.#pointer.postupdate(delta, clientViewportWH, cam);
  }

  register(window: Window, op: 'add' | 'remove'): void {
    this.#pointer.register(window, op);
  }
}
