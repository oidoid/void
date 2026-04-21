import type {OnEvent} from '../event.ts'

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

// to-do: support analog button values, expose connected status and vibration,
//        and distinct devices. would be nice if vibration could merge with
//        navigator.vibrate().
export class Gamepad {
  onEvent: OnEvent = () => {}
  /** ;readonly. */
  polls: {[i: number]: GamepadPoll} = {}
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  register(op: 'add' | 'remove'): this {
    for (const ev of ['gamepadconnected', 'gamepaddisconnected'])
      this.#target[`${op}EventListener`](ev, this.#onEvent)
    return this
  }

  reset(): void {
    this.polls = {}
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  update(): void {
    if (!isSecureContext) return
    this.polls = {}
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue
      let buttons = 0
      for (let i = 0; i < pad.buttons.length; i++)
        if (pad.buttons[i]!.pressed) buttons |= 1 << i
      // https://w3c.github.io/gamepad/#remapping
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

  #onEvent = (ev: Event): void => {
    if (!ev.isTrusted) return // to-do: review other event callbacks for trusted.
    this.onEvent('input-gamepad')
  }
}
