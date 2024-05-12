import {Cam} from '../renderer/cam.js'
import type {XY} from '../types/2d.js'
import {PointerPoller} from './pointer-poller.js'

export class Input<T extends number = 1 | 2 | 3> {
  /** User hint as to whether to consider input or not. */
  handled: boolean = false
  /** The maximum duration in milliseconds permitted between combo inputs. */
  maxInterval: number = 300
  /** The minimum duration in milliseconds for an input to be considered held. */
  minHeld: number = 300

  /**
   * A sequence of nonzero buttons ordered from oldest (first) to latest (last).
   * Combos are terminated only by expiration.
   */
  readonly #combo: number[] = []
  /** The time in milliseconds since the input changed. */
  #duration: number = 0
  readonly #pointer: PointerPoller
  /** Prior button samples independent of combo. Index 0 is current loop. */
  readonly #prevBits: [number, number] = [0, 0]
  #prevTick: number = 0

  constructor(cam: Readonly<Cam>, canvas: HTMLCanvasElement) {
    this.#pointer = new PointerPoller(cam, canvas)
  }

  /**
   * Combos are interpreted exactly both in buttons pressed per tick (eg, 1 will
   * not match 1 and 2 the way `isOn(1)` will) and sequence (order and length).
   * Combos only test button on state.
   */
  isCombo(...combo: readonly T[]): boolean {
    if (combo.length !== this.#combo.length) return false
    for (const [i, buttons] of combo.entries())
      if (this.#combo[i] !== buttons) return false
    // #combo is a historical record of buttons. Whenever buttons changes, a new
    // entry is pushed. Make sure the current entry is the current state and
    // that the last entry's buttons haven't been released.
    return this.#combo[combo.length - 1] === this.#bits
  }

  /** Like isOnCombo() but test if the last button set is triggered. */
  isComboStart(...combo: readonly T[]): boolean {
    return combo.at(-1)
      ? this.isOnStart(combo.at(-1)!) && this.isCombo(...combo)
      : false
  }

  /** True if any button is held on or off. */
  isHeld(): boolean {
    return this.#duration >= this.minHeld
  }

  isOffStart(buttons: T): boolean {
    return !this.isOn(buttons) && this.isAnyStart(buttons)
  }

  /**
   * Test if all buttons are on. True if the buttons are pressed regardless of
   * whether other buttons are pressed. Eg, `isOn(1)` will return true when 1 is
   * pressed or when 1 and 2 are pressed.
   */
  isOn(buttons: T): boolean {
    return (this.#bits & buttons) === buttons
  }

  isOnStart(buttons: T): boolean {
    return this.isOn(buttons) && this.isAnyStart(buttons)
  }

  /** True if any button triggered on or off. */
  isAnyStart(buttons: T): boolean {
    return (this.#bits & buttons) !== (this.#prevBits[1] & buttons)
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
    this.#pointer.register(op)
  }

  reset(): void {
    this.handled = false
    this.#pointer.reset()
  }

  /**
   * The current state and prospective combo member. A zero value can never be a
   * combo member but is necessary to persist in previous to distinguish the off
   * state between repeated button presses like 1, 1.
   */
  get #bits(): number {
    return this.#pointer.bits
  }
}
