export class Gamepad {
  bits: number = 0
  // to-do: support analog button values, expose connected status and vibration,
  //        and distinct devices. would be nice if vibration could merge with
  //        navigator.vibrate().
  readonly bitByAxis: {[axis: number]: [less: number, more: number]} = {}
  readonly bitByButton: {[btn: number]: number} = {}
  onEvent: () => void = () => {}
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  get connected(): boolean {
    return isSecureContext && navigator.getGamepads().filter(Boolean).length > 0
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('gamepadconnected', this.onEvent)
    fn('gamepaddisconnected', this.onEvent)
    return this
  }

  reset(): void {
    this.bits = 0
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  update(): void {
    this.bits = 0
    if (!isSecureContext) return
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue
      for (const [index, axis] of pad.axes.entries() ?? []) {
        const lessMore = this.bitByAxis[index]
        if (!lessMore) continue
        const bit = axis < 0 ? lessMore[0] : axis === 0 ? 0 : lessMore[1]
        this.bits |= Math.abs(axis) >= 0.5 ? bit : 0
      }
      for (const [index, btn] of pad.buttons.entries() ?? []) {
        const bit = this.bitByButton[index]
        if (bit == null) continue
        this.bits |= btn.pressed ? bit : 0
      }
    }
  }
}
