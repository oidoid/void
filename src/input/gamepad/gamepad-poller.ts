import { I32 } from '@/oidlib';
import {
  Button,
  Direction,
  GamepadButtonInput,
  GamepadDirectionInput,
  gamepadMap,
} from '@/void';

interface Pad {
  readonly buttons: I32;
  readonly directions: I32;
}

export class GamepadPoller {
  // Separate button and direction so that they can have distinct durations (and
  // trigger states). Otherwise, up + action transitioning to left + action
  // causes action to retrigger.
  #button: GamepadButtonInput;
  #direction: GamepadDirectionInput;

  /** The current button state. */
  get button(): GamepadButtonInput {
    return this.#button;
  }

  /** The current direction state. */
  get direction(): GamepadDirectionInput {
    return this.#direction;
  }

  constructor() {
    this.#button = new GamepadButtonInput(I32(0), I32(0));
    this.#direction = new GamepadDirectionInput(I32(0), I32(0));
  }

  preupdate(navigator: Navigator): void {
    const gamepads = Array.from(navigator.getGamepads());
    // OR all gamepad button states into one.
    const directionButton = gamepads.reduce(
      reduceGamepads,
      { buttons: I32(0), directions: I32(0) },
    );
    this.#button = new GamepadButtonInput(
      directionButton.buttons == this.#button.buttons
        ? this.#button.duration
        : 0,
      directionButton.buttons,
    );
    this.#direction = new GamepadDirectionInput(
      directionButton.directions == this.#direction.directions
        ? this.#direction.duration
        : 0,
      directionButton.directions,
    );
  }

  postupdate(delta: number): void {
    this.#button.postupdate(delta);
    this.#direction.postupdate(delta);
  }
}

function reduceGamepads(
  sum: Pad,
  pad: Gamepad | null,
): Pad {
  const directions = pad?.axes.reduce(reduceAxes, 0) ?? I32(0);
  const directionsButtons = pad?.buttons.reduce(
    reduceButtons,
    { buttons: I32(0), directions: I32(0) },
  ) ?? { buttons: I32(0), directions: I32(0) };
  return {
    buttons: I32(sum.buttons | directionsButtons.buttons),
    directions: I32(sum.directions | directions | directionsButtons.directions),
  };
}

function reduceButtons(sum: Pad, button: GamepadButton, index: number): Pad {
  const pad = buttonIndexToPadInput(index);
  return {
    buttons: I32(sum.buttons | (button.pressed ? pad.buttons : 0)),
    directions: I32(sum.directions | (button.pressed ? pad.directions : 0)),
  };
}

function buttonIndexToPadInput(index: number): Pad {
  const fn = gamepadMap.buttons[index];
  if (fn == null) return { buttons: I32(0), directions: I32(0) };
  const buttons = Button.toBit[fn as Button] ?? I32(0);
  const directions = Direction.toBit[fn as Direction] ?? I32(0);
  return { buttons, directions };
}

// Always assumed to be Direction not Button.
function reduceAxes(sum: number, axis: number, index: number): I32 {
  const bit = axisIndexToDirection(index, Math.sign(axis));
  return I32(sum | (bit & (Math.abs(axis) >= 0.5 ? bit : 0)));
}

// Always assumed to be Direction not Button.
function axisIndexToDirection(index: number, direction: number): I32 {
  const fn = gamepadMap.axes[index];
  if (fn == null) return I32(0);
  if (direction < 0) return Direction.toBit[fn];
  return Direction.toInvertBit[fn] ?? I32(0);
}
