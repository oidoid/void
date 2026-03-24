export type GamepadMapping =
  (typeof GamepadMapping)[keyof typeof GamepadMapping]
const GamepadMapping = {Unknown: 0, Standard: 1} as const

export type GamepadPoll = {
  /** gamepad slot index. */
  index: number
  /** true if the gamepad is still connected. */
  connected: boolean
  /** button layout mapping. */
  mapping: GamepadMapping
  /** bitmask of pressed buttons. */
  buttons: number
  /** axes in [-1, 1]; standard mapping: [leftX, leftY, rightX, rightY]. */
  axes: readonly [number, number, number, number]
}

export class Gamepad {
  /** ;readonly. */
  polls: {[i: number]: GamepadPoll} = {}

  reset(): void {
    this.polls = {}
  }

  update(): void {
    this.polls = {}
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue
      let buttons = 0
      for (let i = 0; i < pad.buttons.length; i++)
        if (pad.buttons[i]!.pressed) buttons |= 1 << i
      this.polls[pad.index] = {
        index: pad.index,
        connected: pad.connected,
        mapping:
          GamepadMapping[pad.mapping as keyof typeof GamepadMapping] ??
          GamepadMapping.Unknown,
        buttons,
        axes: [
          pad.axes[0] ?? 0,
          pad.axes[1] ?? 0,
          pad.axes[2] ?? 0,
          pad.axes[3] ?? 0
        ]
      }
    }
  }
}
