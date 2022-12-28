import { Button, gamepadMap } from '@/void';

export class GamepadPoller {
  #buttons: bigint = 0n;

  get sample(): bigint {
    return this.#buttons;
  }

  reset(): void {
    this.#buttons = 0n;
  }

  preupdate(): void {
    const gamepads = Array.from(navigator.getGamepads());
    // OR all gamepad button states into one.
    this.#buttons = gamepads.reduce(reduceGamepads, 0n);
  }
}

function reduceGamepads(sum: bigint, pad: Gamepad | null): bigint {
  const axes = pad?.axes.reduce(reduceAxes, 0n) ?? 0n;
  const directionsButtons = pad?.buttons.reduce(reduceButtons, 0n) ?? 0n;
  return sum | axes | directionsButtons;
}

function reduceButtons(
  sum: bigint,
  gamepadButton: GamepadButton,
  index: number,
): bigint {
  const button = buttonIndexToButton(index);
  return sum | (gamepadButton.pressed ? button : 0n);
}

function buttonIndexToButton(index: number): bigint {
  const fn = gamepadMap.buttons[index];
  if (fn == null) return 0n;
  return Button.Bit[fn];
}

function reduceAxes(sum: bigint, axis: number, index: number): bigint {
  const bit = axisIndexToButton(index, Math.sign(axis));
  const on = Math.abs(axis) >= 0.5;
  return sum | (bit & (on ? bit : 0n));
}

function axisIndexToButton(index: number, direction: number): bigint {
  const fn = gamepadMap.axes[index];
  if (fn == null) return 0n;
  if (direction < 0) return Button.Bit[fn];
  return Button.InvertBit[fn] ?? 0n;
}
