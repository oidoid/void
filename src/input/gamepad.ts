export class Gamepad {
  bits: number = 0
  // to-do: support analog button values, expose connected status and vibration,
  //        and distinct devices. would be nice if vibration could merge with
  //        navigator.vibrate().
  readonly bitByAxis: {[axis: number]: [less: number, more: number]} = {}
  readonly bitByButton: {[btn: number]: number} = {}

  reset(): void {
    this.bits = 0
  }

  update(): void {
    if (!isSecureContext) return
    this.bits = 0
    for (const pad of navigator.getGamepads()) {
      for (const [index, axis] of pad?.axes.entries() ?? []) {
        const lessMore = this.bitByAxis[index]
        if (!lessMore) continue
        const bit = axis < 0 ? lessMore[0] : axis === 0 ? 0 : lessMore[1]
        this.bits |= Math.abs(axis) >= 0.5 ? bit : 0
      }
      for (const [index, btn] of pad?.buttons.entries() ?? []) {
        const bit = this.bitByButton[index]
        if (bit == null) continue
        this.bits |= btn.pressed ? bit : 0
      }
    }
  }
}
