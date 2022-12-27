import { I16Box, I16XY, NumberXY } from '@/oidlib';
import {
  Button,
  Direction,
  GamepadPoller,
  PointerButton,
  PointerInput,
  PointerPoller,
  PointerType,
} from '@/void';

export class InputPoller {
  #pad: GamepadPoller;
  #pointer: PointerPoller;

  get pointer(): PointerInput | undefined {
    return this.#pointer.input;
  }

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
    const pointerButton = this.#inputToPointerButton(button);
    return pointerButton != null && this.#pointer.input?.isOn(pointerButton) ||
      Button.is(button) && this.#pad.button.isOn(button) ||
      Direction.is(button) && this.#pad.direction.isOn(button);
  }

  isOnStart(button: Button | Direction): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return pointerButton != null &&
        this.#pointer.input?.isOnStart(pointerButton) ||
      Button.is(button) && this.#pad.button.isOnStart(button) ||
      Direction.is(button) && this.#pad.direction.isOnStart(button);
  }

  isOnHeld(button: Button | Direction): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return pointerButton != null &&
        this.#pointer.input?.isOnHeld(pointerButton) ||
      Button.is(button) && this.#pad.button.isOnHeld(button) ||
      Direction.is(button) && this.#pad.direction.isOnHeld(button);
  }

  isOff(button: Button | Direction): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return pointerButton != null && this.#pointer.input?.isOff(pointerButton) ||
      Button.is(button) && this.#pad.button.isOff(button) ||
      Direction.is(button) && this.#pad.direction.isOff(button);
  }

  isOffStart(button: Button | Direction): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return pointerButton != null &&
        this.#pointer.input?.isOffStart(pointerButton) ||
      Button.is(button) && this.#pad.button.isOffStart(button) ||
      Direction.is(button) && this.#pad.direction.isOffStart(button);
  }

  isOffHeld(button: Button | Direction): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return pointerButton != null &&
        this.#pointer.input?.isOffHeld(pointerButton) ||
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

  #inputToPointerButton(
    button: Button | Direction,
  ): PointerButton | undefined {
    return PointerButton
      .fromInput[
        button as keyof typeof PointerButton.fromInput
      ] as PointerButton;
  }
}
