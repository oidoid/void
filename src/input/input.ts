import {Cam} from '../renderer/cam.js'
import type {XY} from '../types/2d.js'
import {GamepadPoller} from './gamepad-poller.js'
import {KeyboardPoller} from './keyboard-poller.js'
import {PointerPoller} from './pointer-poller.js'

// prettier-ignore
export type StandardButton =
  'L' | 'R' | 'U' | 'D' | // Dpad.
  'C' | 'B' | 'A' | // Primary, secondary, tertiary.
  'S' // Start.

export class Input<T extends string> {
  /** User hint as to whether to consider input or not. */
  handled: boolean = false
  /** The maximum duration in milliseconds permitted between combo inputs. */
  maxInterval: number = 300
  /** The minimum duration in milliseconds for an input to be considered held. */
  minHeld: number = 300

  /** Logical button to bit. */
  readonly #bitByButton = <{[button in T]: number}>{}
  /**
   * A sequence of nonzero buttons ordered from oldest (first) to latest (last).
   * Combos are terminated only by expiration.
   */
  readonly #combo: number[] = []
  /** The time in milliseconds since the input changed. */
  #duration: number = 0
  readonly #gamepad: GamepadPoller = new GamepadPoller()
  readonly #keyboard: KeyboardPoller = new KeyboardPoller()
  readonly #pointer: PointerPoller
  /** Prior button samples independent of combo. Index 0 is current loop. */
  readonly #prevBits: [number, number] = [0, 0]
  #prevTick: number = 0

  constructor(cam: Readonly<Cam>, canvas: HTMLCanvasElement) {
    this.#pointer = new PointerPoller(cam, canvas)
  }

  /**
   * Combos are interpreted exactly both in buttons pressed per tick (eg, up
   * will not match up and down the way `isOn('Up')` will) and sequence (order
   * and length). Combos only test button on state.
   */
  isCombo(...combo: readonly (readonly T[])[]): boolean {
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
  isComboStart(...combo: readonly (readonly T[])[]): boolean {
    return (
      this.isCombo(...combo) &&
      !!combo.at(-1)?.every(button => this.isOnStart(button))
    )
  }

  /** True if any button is held on or off. */
  isHeld(): boolean {
    return this.#duration >= this.minHeld
  }

  isOffStart(...buttons: readonly T[]): boolean {
    return !this.isOn(...buttons) && this.isAnyStart(...buttons)
  }

  /**
   * Test if all buttons are on. True if the buttons are pressed regardless of
   * whether other buttons are pressed. Eg, `isOn('Up')` will return true when
   * up is pressed or when up and down are pressed.
   */
  isOn(...buttons: readonly T[]): boolean {
    const bits = this.#buttonsToBits(buttons)
    return (this.#bits & bits) === bits
  }

  isOnStart(...buttons: readonly T[]): boolean {
    return this.isOn(...buttons) && this.isAnyStart(...buttons)
  }

  /** True if any button triggered on or off. */
  isAnyStart(...buttons: readonly T[]): boolean {
    const bits = this.#buttonsToBits(buttons)
    return (this.#bits & bits) !== (this.#prevBits[1] & bits)
  }

  mapAxis(less: T, more: T, ...axes: readonly number[]): void {
    for (const axis of axes) {
      this.#gamepad.mapAxis(axis, this.#map(less), this.#map(more))
    }
  }

  mapButton(button: T, ...indices: readonly number[]): void {
    for (const index of indices) {
      this.#gamepad.mapButton(index, this.#map(button))
    }
  }

  mapClick(button: T, ...clicks: readonly number[]): void {
    for (const click of clicks) this.#pointer.map(click, this.#map(button))
  }

  mapStandard(): void {
    this.mapKey(<T>'L', 'ArrowLeft', 'a', 'A')
    this.mapKey(<T>'R', 'ArrowRight', 'd', 'D')
    this.mapKey(<T>'U', 'ArrowUp', 'w', 'W')
    this.mapKey(<T>'D', 'ArrowDown', 's', 'S')
    this.mapKey(<T>'C', 'c', 'C')
    this.mapKey(<T>'B', 'x', 'X')
    this.mapKey(<T>'A', 'z', 'Z')
    this.mapKey(<T>'S', 'Enter', 'Escape')

    // https://w3c.github.io/gamepad/#remapping
    this.mapAxis(<T>'L', <T>'R', 0, 2)
    this.mapAxis(<T>'U', <T>'D', 1, 3)
    this.mapButton(<T>'L', 14)
    this.mapButton(<T>'R', 15)
    this.mapButton(<T>'U', 12)
    this.mapButton(<T>'D', 13)
    this.mapButton(<T>'A', 0)
    this.mapButton(<T>'S', 9)

    this.mapClick(<T>'A', 1)
  }

  /** @arg keys Union of case-sensitive KeyboardEvent.key. */
  mapKey(button: T, ...keys: readonly string[]): void {
    for (const key of keys) this.#keyboard.map(key, this.#map(button))
  }

  get point(): Readonly<XY> | undefined {
    return this.#pointer.xy
  }

  get pointType(): 'mouse' | 'touch' | 'pen' | undefined {
    return this.#pointer.type
  }

  poll(tick: number): void {
    this.handled = false
    this.#duration += this.#prevTick
    this.#prevTick = tick
    this.#prevBits[1] = this.#prevBits[0]
    this.#prevBits[0] = this.#bits

    this.#gamepad.poll()
    if (
      this.#duration > this.maxInterval &&
      (this.#bits === 0 || this.#bits !== this.#prevBits[1])
    ) {
      // Expired.
      this.#duration = 0
      this.#combo.length = 0
    } else if (this.#bits !== this.#prevBits[1]) {
      // Some button state has changed and at least one button is still pressed.
      this.#duration = 0
      if (this.#bits !== 0) this.#combo.push(this.#bits)
    } else if (this.#bits !== 0 && this.#bits === this.#prevBits[1]) {
      // Held. Update combo with the latest buttons.
      this.#combo.pop()
      this.#combo.push(this.#bits)
    }
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

  #buttonsToBits(buttons: readonly T[]): number {
    let bits = 0
    for (const button of buttons) bits |= this.#bitByButton[button] ?? 0
    return bits
  }

  #map(button: T): number {
    return (this.#bitByButton[button] ??=
      1 << Object.keys(this.#bitByButton).length)
  }
}
