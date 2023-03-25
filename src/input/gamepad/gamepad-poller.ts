import { Uint } from '@/ooz'
import { Button, gamepadMap } from '@/void'

export interface GamepadHub extends Pick<Navigator, 'getGamepads'> {}
export interface SecureContext
  extends Pick<WindowOrWorkerGlobalScope, 'isSecureContext'> {}

export class GamepadPoller {
  #buttons: Uint = Uint(0)
  #hub: GamepadHub
  #security: SecureContext

  constructor(hub: GamepadHub, security: SecureContext) {
    this.#hub = hub
    this.#security = security
  }

  preupdate(): void {
    if (!this.#security.isSecureContext) return
    const gamepads = this.#hub.getGamepads()
    // OR all gamepad button states into one.
    this.#buttons = gamepads.reduce(reduceGamepads, Uint(0))
  }

  reset(): void {
    this.#buttons = Uint(0)
  }

  get sample(): Uint {
    return this.#buttons
  }
}

function reduceGamepads(sum: Uint, pad: Gamepad | null): Uint {
  const axes = pad?.axes.reduce(reduceAxes, Uint(0)) ?? Uint(0)
  const directionsButtons = pad?.buttons.reduce(reduceButtons, Uint(0)) ??
    Uint(0)
  // to-do: use Uint-safe or.
  return Uint(sum | axes | directionsButtons)
}

function reduceButtons(
  sum: Uint,
  gamepadButton: GamepadButton,
  index: number,
): Uint {
  const button = buttonIndexToButton(index)
  // to-do: use Uint-safe or.
  return Uint(sum | (gamepadButton.pressed ? button : 0))
}

function buttonIndexToButton(index: number): Uint {
  const fn = gamepadMap.buttons[index]
  if (fn == null) return Uint(0)
  return Button.Bit[fn]
}

function reduceAxes(sum: Uint, axis: number, index: number): Uint {
  const bit = axisIndexToButton(index, Math.sign(axis))
  const on = Math.abs(axis) >= 0.5
  // to-do: use Uint-safe or.
  return Uint(sum | (bit & (on ? bit : 0)))
}

function axisIndexToButton(index: number, direction: number): Uint {
  const fn = gamepadMap.axes[index]
  if (fn == null) return Uint(0)
  if (direction < 0) return Button.Bit[fn]
  return Button.InvertBit[fn] ?? Uint(0)
}
