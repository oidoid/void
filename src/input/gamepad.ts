/** @internal */
export class Gamepad {
  bits: number = 0
  // to-do: support analog button values, expose connected status and vibration,
  //        and distinct devices. would be nice if vibration could merge with
  //        navigator.vibrate().
  readonly bitByAxis: {[axis: number]: [less: number, more: number]} = {}
  readonly bitByButton: {[btn: number]: number} = {}
  #invalid: boolean = false
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  get invalid(): boolean {
    return (
      this.#invalid ||
      // gamepads must be polled.
      (isSecureContext && navigator.getGamepads().filter(Boolean).length > 0)
    )
  }

  postupdate(): void {
    this.#invalid = false
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('gamepadconnected', this.#onGamePad)
    fn('gamepaddisconnected', this.#onGamePad)
    return this
  }

  reset(): void {
    this.bits = 0
    this.#invalid = false
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  update(): void {
    if (!isSecureContext) return
    let bits = 0
    for (const pad of navigator.getGamepads()) {
      for (const [index, axis] of pad?.axes.entries() ?? []) {
        const lessMore = this.bitByAxis[index]
        if (!lessMore) continue
        const bit = axis < 0 ? lessMore[0] : axis === 0 ? 0 : lessMore[1]
        bits |= Math.abs(axis) >= 0.5 ? bit : 0
      }
      for (const [index, btn] of pad?.buttons.entries() ?? []) {
        const bit = this.bitByButton[index]
        if (bit == null) continue
        bits |= btn.pressed ? bit : 0
      }
    }
    this.#invalid ||= bits !== this.bits
    this.bits = bits
  }

  #onGamePad = (): void => {
    this.#invalid = true
  }
}
