export class NavigatorGamepadsMock {
  readonly #getGamepads = globalThis.navigator.getGamepads
  #gamepads: readonly (Gamepad | null)[] = []

  constructor() {
    Object.assign(globalThis.navigator, {getGamepads: () => this.#gamepads})
  }

  set gamepads(pads: readonly (Gamepad | null)[]) {
    this.#gamepads = pads
  }

  [Symbol.dispose](): void {
    Object.assign(globalThis.navigator, {getGamepads: this.#getGamepads})
  }
}
