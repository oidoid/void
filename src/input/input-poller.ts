import { I16Box, I16XY, NumberXY } from '@/oidlib';
import {
  GamepadPoller,
  InputButton,
  InputDirection,
  PointerButton,
  PointerInput,
  PointerPoller,
  PointerType,
} from '@/void';

export class InputPoller {
  #pad: GamepadPoller;
  #pointer: PointerPoller;

  get pointer(): PointerInput | undefined {
    return this.#pointer.pointer;
  }

  get pointerType(): PointerType | undefined {
    return this.#pointer?.pointerType;
  }

  get xy(): I16XY | undefined {
    return this.#pointer?.xy;
  }

  constructor() {
    this.#pad = new GamepadPoller();
    this.#pointer = new PointerPoller();
  }

  on(button: InputButton | InputDirection): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return pointerButton != null && this.#pointer.on(pointerButton) ||
      this.#pad.on(button);
  }

  onStart(button: InputButton | InputDirection): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return pointerButton != null && this.#pointer.onStart(pointerButton) ||
      this.#pad.onStart(button);
  }

  onLong(button: InputButton | InputDirection): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return pointerButton != null && this.#pointer.onLong(pointerButton) ||
      this.#pad.onLong(button);
  }

  off(button: InputButton | InputDirection): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return (pointerButton == null || this.#pointer.off(pointerButton)) ||
      this.#pad.off(button);
  }

  offStart(button: InputButton | InputDirection): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return (pointerButton == null || this.#pointer.offStart(pointerButton)) ||
      this.#pad.offStart(button);
  }

  offLong(button: InputButton | InputDirection): boolean {
    const pointerButton = this.#inputToPointerButton(button);
    return (pointerButton == null || this.#pointer.offLong(pointerButton)) ||
      this.#pad.offLong(button);
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
    button: InputButton | InputDirection,
  ): PointerButton | undefined {
    return PointerButton
      .fromInput[
        button as keyof typeof PointerButton.fromInput
      ] as PointerButton;
  }
}
