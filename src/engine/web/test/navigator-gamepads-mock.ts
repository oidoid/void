export class NavigatorGamepadsMock {
  readonly #getGamepads = navigator.getGamepads
  #gamepads: (Gamepad | null)[] = []

  constructor() {
    navigator.getGamepads = () => this.#gamepads
  }

  set gamepads(pads: (Gamepad | null)[]) {
    this.#gamepads = pads
  }

  [Symbol.dispose](): void {
    navigator.getGamepads = this.#getGamepads
  }
}
