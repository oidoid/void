import { Cam } from '../graphics/cam.ts'
import { XY } from '../types/2d.ts'
import { GamepadPoller } from './gamepad-poller.ts'
import { KeyboardPoller } from './keyboard-poller.ts'
import { PointerPoller } from './pointer-poller.ts'

/** C is primary, B is secondary, A is tertiary. */
// deno-fmt-ignore
export type StandardButton =
  'L' | 'R' | 'U' | 'D' |
  'C' | 'B' | 'A' |
  'S'

export class Input<Button extends string = StandardButton> {
  handled = false
  /** The maximum duration in milliseconds permitted between combo inputs. */
  maxInterval = 300
  /** The minimum duration in milliseconds for an input to be considered held. */
  minHeld = 300

  /** The time in milliseconds since the input changed. */
  #duration = 0
  /** Prior button state, possibly 0, but not necessarily a combo member. */
  #prevBits = 0
  /**
   * A sequence of nonzero buttons ordered from oldest (first) to latest (last).
   * Combos are terminated only by expiration.
   */
  readonly #combo: number[] = []
  /** Logical button to bit. */
  readonly #bitByButton = {} as Record<Button, number>
  readonly #gamepad = new GamepadPoller()
  readonly #keyboard = new KeyboardPoller()
  readonly #pointer: PointerPoller
  #pollBits = 0
  #pollTick = 0

  constructor(cam: Readonly<Cam>, canvas: HTMLCanvasElement) {
    this.#pointer = new PointerPoller(cam, canvas)
  }

  /**
   * Combos are interpreted exactly both in buttons pressed per tick (eg, up
   * will not match up and down the way `isOn('Up')` will) and sequence (order
   * and length). Combos only test button on state.
   */
  isCombo(...combo: readonly (readonly Button[])[]): boolean {
    if (combo.length !== this.#combo.length) return false
    for (const [i, buttons] of combo.entries()) {
      const bits = this.#buttonsToBits(buttons)
      if (this.#combo[i] !== bits) return false
    }
    // #combo is a historical record of buttons. Whenever buttons changes, a new
    // entry is pushed. Make sure the current entry is the current state and
    // that the last entry's buttons haven't been released.
    return this.#combo[combo.length - 1] === this.#bits
  }

  /** Like isOnCombo() but test if the last button set is triggered. */
  isComboStart(...combo: readonly (readonly Button[])[]): boolean {
    return this.isCombo(...combo) &&
      !!combo.at(-1)?.every((button) => this.isOnStart(button))
  }

  /** True if held on or off. */
  isHeld(): boolean {
    return this.#duration >= this.minHeld
  }

  isOffStart(...buttons: readonly Button[]): boolean {
    return !this.isOn(...buttons) && this.isStart(...buttons)
  }

  /**
   * Test if all buttons are on. True if the buttons are pressed regardless of
   * whether other buttons are pressed. Eg, `isOn('Up')` will return true when
   * up is pressed or when up and down are pressed.
   */
  isOn(...buttons: readonly Button[]): boolean {
    const bits = this.#buttonsToBits(buttons)
    return (this.#bits & bits) === bits
  }

  isOnStart(...buttons: readonly Button[]): boolean {
    return this.isOn(...buttons) && this.isStart(...buttons)
  }

  /** True if triggered on or off. */
  isStart(...buttons: readonly Button[]): boolean {
    const bits = this.#buttonsToBits(buttons)
    return (this.#bits & bits) !== (this.#prevBits & bits)
  }

  mapAxis(less: Button, more: Button, ...axes: readonly number[]): void {
    for (const axis of axes) {
      this.#gamepad.mapAxis(axis, this.#map(less), this.#map(more))
    }
  }

  mapButton(button: Button, ...indices: readonly number[]): void {
    for (const index of indices) {
      this.#gamepad.mapButton(index, this.#map(button))
    }
  }

  mapClick(button: Button, ...clicks: readonly number[]): void {
    for (const click of clicks) this.#pointer.map(click, this.#map(button))
  }

  mapStandard(): void {
    this.mapKey('L' as Button, 'ArrowLeft', 'a')
    this.mapKey('R' as Button, 'ArrowRight', 'd')
    this.mapKey('U' as Button, 'ArrowUp', 'w')
    this.mapKey('D' as Button, 'ArrowDown', 's')
    this.mapKey('C' as Button, 'z')
    this.mapKey('B' as Button, 'x')
    this.mapKey('A' as Button, 'c')
    this.mapKey('S' as Button, 'Enter', 'Escape')

    // https://w3c.github.io/gamepad/#remapping
    this.mapAxis('L' as Button, 'R' as Button, 0, 2)
    this.mapAxis('U' as Button, 'D' as Button, 1, 3)
    this.mapButton('L' as Button, 14)
    this.mapButton('R' as Button, 15)
    this.mapButton('U' as Button, 12)
    this.mapButton('D' as Button, 13)
    this.mapButton('A' as Button, 0)
    this.mapButton('S' as Button, 9)

    this.mapClick('A' as Button, 1)
  }

  mapKey(button: Button, ...keys: readonly string[]): void {
    for (const key of keys) this.#keyboard.map(key, this.#map(button))
  }

  get point(): Readonly<XY> | undefined {
    return this.#pointer.xy
  }

  get pointType(): 'mouse' | 'touch' | 'pen' | undefined {
    return this.#pointer.pointerType
  }

  poll(tick: number): void {
    this.handled = false
    this.#duration += this.#pollTick
    this.#prevBits = this.#pollBits

    this.#gamepad.poll()
    if (
      this.#duration > this.maxInterval &&
      (this.#bits === 0 || this.#bits !== this.#prevBits)
    ) {
      // Expired.
      this.#duration = 0
      this.#combo.length = 0
    } else if (this.#bits !== this.#prevBits) {
      // Some button state has changed and at least one button is still pressed.
      this.#duration = 0
      if (this.#bits !== 0) this.#combo.push(this.#bits)
    } else if (this.#bits !== 0 && this.#bits === this.#prevBits) {
      // Held. Update combo with the latest buttons.
      this.#combo.pop()
      this.#combo.push(this.#bits)
    }

    this.#pollTick = tick
    this.#pollBits = this.#bits
  }

  register(op: 'add' | 'remove'): void {
    this.#keyboard.register(op)
    this.#pointer.register(op)
  }

  reset(): void {
    this.handled = false
    this.#gamepad.reset()
    this.#keyboard.reset()
    this.#pointer.reset()
  }

  /**
   * The current state and prospective combo member. A zero value can never be a
   * combo member but is necessary to persist in previous to distinguish the off
   * state between repeated button presses like up, up.
   */
  get #bits(): number {
    return this.#gamepad.bits | this.#keyboard.bits | this.#pointer.bits
  }

  #buttonsToBits(buttons: readonly Button[]): number {
    let bits = 0
    for (const button of buttons) bits |= this.#bitByButton[button] ?? 0
    return bits
  }

  #map(button: Button): number {
    return this.#bitByButton[button] ??= 1 <<
      Object.keys(this.#bitByButton).length
  }
}
