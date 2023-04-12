import { ButtonBit, gamepadMap, InvertButtonBit } from '@/void'

export interface GamepadHub extends Pick<Navigator, 'getGamepads'> {}
export interface SecureContext
  extends Pick<WindowOrWorkerGlobalScope, 'isSecureContext'> {}

export class GamepadPoller {
  #buttons = 0
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
    this.#buttons = gamepads.reduce(reduceGamepads, 0)
  }

  reset(): void {
    this.#buttons = 0
  }

  get sample(): number {
    return this.#buttons
  }
}

function reduceGamepads(sum: number, pad: Gamepad | null): number {
  const axes = pad?.axes.reduce(reduceAxes, 0) ?? 0
  const directionsButtons = pad?.buttons.reduce(reduceButtons, 0) ?? 0
  return sum | axes | directionsButtons
}

function reduceButtons(
  sum: number,
  gamepadButton: GamepadButton,
  index: number,
): number {
  const button = buttonIndexToButton(index)
  return sum | (gamepadButton.pressed ? button : 0)
}

function buttonIndexToButton(index: number): number {
  const fn = gamepadMap.buttons[index]
  if (fn == null) return 0
  return ButtonBit[fn]
}

function reduceAxes(sum: number, axis: number, index: number): number {
  const bit = axisIndexToButton(index, Math.sign(axis))
  const on = Math.abs(axis) >= 0.5
  return sum | (bit & (on ? bit : 0))
}

function axisIndexToButton(index: number, direction: number): number {
  const fn = gamepadMap.axes[index]
  if (fn == null) return 0
  if (direction < 0) return ButtonBit[fn]
  return InvertButtonBit[fn] ?? 0
}
