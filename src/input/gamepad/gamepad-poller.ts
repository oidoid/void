import { I32 } from '@/oidlib';
import {
  GamepadButtonInput,
  GamepadDirectionInput,
  gamepadMap,
  InputButton,
} from '@/void';
import { InputDirection } from '../input-button.ts';

export class GamepadPoller {
  // Separate button and direction so that they can have distinct durations (and
  // trigger states). Otherwise, up + action transitioning to left + action
  // causes action to retrigger _and_ never trigger an off state.
  #button: GamepadButtonInput;
  #direction: GamepadDirectionInput;

  constructor() {
    this.#button = GamepadButtonInput(I32(0), I32(0));
    this.#direction = GamepadDirectionInput(I32(0), I32(0));
  }

  on(button: InputButton | InputDirection): boolean {
    if (InputButton.values.has(button as InputButton)) {
      const mask = InputButton.toBit[button as InputButton];
      return (this.#button.buttons & mask) == mask;
    }
    const mask = InputDirection.toBit[button as InputDirection];
    return (this.#direction.directions & mask) == mask;
  }

  onStart(button: InputButton | InputDirection): boolean {
    return this.#start(button) && this.on(button);
  }

  onLong(button: InputButton | InputDirection): boolean {
    return this.#long(button) && this.on(button);
  }

  off(button: InputButton | InputDirection): boolean {
    return !this.on(button);
  }

  offStart(button: InputButton | InputDirection): boolean {
    return this.off(button) && this.#start(button);
  }

  offLong(button: InputButton | InputDirection): boolean {
    return this.off(button) && this.#long(button);
  }

  preupdate(navigator: Navigator): void {
    const gamepads = Array.from(navigator.getGamepads());
    // OR all gamepad button states into one.
    const directionButton = gamepads.reduce(reduceGamepads, [I32(0), I32(0)]);
    this.#button = GamepadButtonInput(
      directionButton[1],
      directionButton[1] == this.#button.buttons ? this.#button.duration : 0,
    );
    this.#direction = GamepadDirectionInput(
      directionButton[0],
      directionButton[0] == this.#direction.directions
        ? this.#direction.duration
        : 0,
    );
  }

  postupdate(delta: number): void {
    this.#button = GamepadButtonInput(
      this.#button.buttons,
      this.#button.duration + delta,
    );
    this.#direction = GamepadDirectionInput(
      this.#direction.directions,
      this.#direction.duration + delta,
    );
  }

  /** True if triggered. */
  #start(button: InputButton | InputDirection): boolean {
    if (InputButton.values.has(button as InputButton)) {
      return this.#button.duration == 0;
    }
    return this.#direction.duration == 0;
  }

  #long(button: InputButton | InputDirection): boolean {
    // to-do: constant here and in PointerPoller.
    if (InputButton.values.has(button as InputButton)) {
      return this.#button.duration > 400;
    }
    return this.#direction.duration > 400;
  }
}

function reduceGamepads(
  sum: [direction: I32, button: I32],
  pad: Gamepad | null,
): [direction: I32, button: I32] {
  const direction = pad?.axes.reduce(reduceAxes, 0) ?? I32(0);
  const directionButton =
    pad?.buttons.reduce(reduceButtons, [I32(0), I32(0)]) ?? [I32(0), I32(0)];
  return [
    I32(sum[0] | direction | directionButton[0]),
    I32(sum[1] | directionButton[1]),
  ];
}

function reduceButtons(
  sum: [direction: I32, button: I32],
  button: GamepadButton,
  index: number,
): [direction: I32, button: I32] {
  const directionButton = buttonIndexToButton(index);
  return [
    I32(sum[0] | (button.pressed ? directionButton[0] : 0)),
    I32(sum[1] | (button.pressed ? directionButton[1] : 0)),
  ];
}

function buttonIndexToButton(index: number): [direction: I32, button: I32] {
  const fn = gamepadMap
    .buttons[
      index.toString() as keyof typeof gamepadMap.buttons
    ] as InputButton | InputDirection | undefined;
  if (fn == null) return [I32(0), I32(0)];
  const button = InputButton.toBit[fn as InputButton] ?? I32(0);
  const direction = InputDirection.toBit[fn as InputDirection] ?? I32(0);
  return [direction, button];
}

// Always assumed to be InputDirection.
function reduceAxes(sum: number, axis: number, index: number): I32 {
  const bit = axisIndexToButton(index, Math.sign(axis));
  return I32(sum | (bit && Math.abs(axis) > 0.5 ? bit : 0));
}

// Always assumed to be InputDirection.
function axisIndexToButton(index: number, direction: number): I32 {
  const fn = gamepadMap.axes[
    index.toString() as keyof typeof gamepadMap.axes
  ] as InputDirection | undefined;
  if (fn == null) return I32(0);
  return direction < 0 ? InputDirection.toBit[fn] : InputDirection
    .toInvertBit[
      fn as keyof typeof InputDirection.toInvertBit
    ] ?? I32(0);
}
