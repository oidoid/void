import { I16Box, I16XY, NumberXY } from '@/oidlib';
import { Button, InputPoller, PointerType } from '@/void';

export class Input {
  /** The time in milliseconds since the input changed. */
  #duration: number = 0;

  /**
   * The current state and prospective combo member. A zero value can never be a
   * combo member but is necessary to persist in previous to distinguish the off
   * state between repeated button presses like [UP, UP].
   */
  readonly #poller: InputPoller = new InputPoller();

  /**
   * The previous button state, possible 0, but not necessarily a combo member.
   */
  #prevButtons: bigint = 0n;

  /**
   * A sequence of nonzero buttons ordered from oldest (first) to latest (last).
   * Combos are terminated only by expiration.
   */
  readonly #combo: bigint[] = [];

  /** The maximum duration in milliseconds permitted between combo inputs. */
  #maxInterval: number;

  /** The minimum duration in milliseconds for an input to be considered held. */
  #minHeld: number;

  get buttons(): bigint {
    return this.#poller.sample;
  }

  get pointerType(): PointerType | undefined {
    return this.#poller.pointerType;
  }

  get xy(): Readonly<I16XY> | undefined {
    return this.#poller.xy;
  }

  constructor(minHeld = 300, maxInterval: number = 300) {
    this.#minHeld = minHeld;
    this.#maxInterval = maxInterval;
  }

  /**
   * Combos are interpreted exactly both in buttons pressed per tick (eg, up
   * will not match up + down the way `isOn('Up')` will) and sequence (order and
   * length).
   *
   * Combos only test button on state.
   */
  isCombo(...combo: readonly (readonly Button[])[]): boolean {
    if (combo.length != this.#combo.length) return false;
    for (const [i, buttons] of combo.entries()) {
      const mask = buttons.reduce(
        (sum, button) => sum | Button.Bit[button],
        0n,
      );
      if (this.#combo[i] != mask) return false;
      if (i == (combo.length - 1) && mask != this.buttons) return false;
    }
    return true;
  }

  /** Like isOnCombo() but test if the last button event is triggered. */
  isComboStart(...combo: readonly (readonly Button[])[]): boolean {
    return this.isCombo(...combo) &&
      !!combo.at(-1)?.every((button) => this.isOnStart(button));
  }

  /** Like isOnCombo() but test if the last button event is held. */
  isComboHeld(...combo: readonly (readonly Button[])[]): boolean {
    return this.isCombo(...combo) && this.isHeld();
  }

  /**
   * Test if all buttons are on. True if the buttons are pressed regardless of
   * whether other buttons are pressed. Eg, `isOn('Up')` will return true when
   * up is pressed, up and down are pressed, and up and any other button is
   * pressed.
   */
  isOn(...buttons: readonly Button[]): boolean {
    return buttons.every((button) => {
      const mask = Button.Bit[button];
      return (this.buttons & mask) == mask;
    });
  }

  isOnStart(...buttons: readonly Button[]): boolean {
    return this.isOn(...buttons) && this.isStart(...buttons);
  }

  isOnHeld(...buttons: readonly Button[]): boolean {
    return this.isOn(...buttons) && this.isHeld();
  }

  isOff(...buttons: readonly Button[]): boolean {
    return !this.isOn(...buttons);
  }

  isOffStart(...buttons: readonly Button[]): boolean {
    return this.isOff(...buttons) && this.isStart(...buttons);
  }

  isOffHeld(...buttons: readonly Button[]): boolean {
    return this.isOff(...buttons) && this.isHeld();
  }

  /** True if triggered on or off. */
  isStart(...buttons: readonly Button[]): boolean {
    return buttons.every((button) => {
      const mask = Button.Bit[button];
      return this.#duration == 0 &&
        (this.buttons & mask) != (this.#prevButtons & mask);
    });
  }

  /** True if held on or off. */
  isHeld(): boolean {
    return this.#duration >= this.#minHeld;
  }

  preupdate(): void {
    this.#poller.preupdate();
    if (
      this.#duration > this.#maxInterval &&
      (this.buttons == 0n || this.buttons != this.#prevButtons)
    ) {
      // Expired.
      this.#duration = 0;
      this.#combo.length = 0;
    } else if (this.buttons != this.#prevButtons) {
      // Some button state has changed and at least one button is still pressed.
      this.#duration = 0;
      if (this.buttons != 0n) this.#combo.push(this.buttons);
    } else if (this.buttons != 0n && this.buttons == this.#prevButtons) {
      // Held. Update combo with the latest buttons.
      this.#combo.pop();
      this.#combo.push(this.buttons);
    }
  }

  /**
   * Call this function *after* processing the collected input. This function
   * primes the poller to collect input for the next frame so it should occur
   * towards the end of the game update loop *after* entity processing.
   */
  postupdate(
    delta: number,
    clientViewportWH: Readonly<NumberXY>,
    cam: Readonly<I16Box>,
  ): void {
    this.#poller.postupdate(clientViewportWH, cam);
    this.#duration += delta;
    this.#prevButtons = this.buttons;
  }

  register(op: 'add' | 'remove'): void {
    this.#poller.register(op);
  }

  reset(): void {
    this.#poller.reset();
  }
}
