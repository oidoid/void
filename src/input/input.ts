import { I16Box, I16XY, NumberXY } from '@/oidlib';
import { Button, InputPoller, PointerType } from '@/void';

/** The maximum duration in milliseconds permitted between combo inputs. */
const maxInterval: number = 300;

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

  get buttons(): bigint {
    return this.#poller.sample;
  }

  get pointerType(): PointerType | undefined {
    return this.#poller.pointerType;
  }

  get xy(): Readonly<I16XY> | undefined {
    return this.#poller.xy;
  }

  /**
   * Combos are interpreted exactly both in buttons pressed per tick (eg, up
   * will not match up + down the way `isOn('Up')` will) and sequence (order and
   * length).
   */
  isOnCombo(...combo: readonly (readonly Button[])[]): boolean {
    if (combo.length != this.#combo.length) return false;
    for (const [i, buttons] of combo.entries()) {
      const mask = buttons.reduce(
        (sum, button) => sum | Button.Bit[button],
        0n,
      );
      if (this.#combo[i] != mask) return false;
    }
    return true;
  }

  /** Like isOnCombo() but test if the last button event is triggered. */
  isOnComboStart(...combo: readonly (readonly Button[])[]): boolean {
    return this.isOnCombo(...combo) &&
      !!combo.at(-1)?.every((button) => this.isOnStart(button));
  }

  /** Like isOnCombo() but test if the last button event is held. */
  isOnComboHeld(...combo: readonly (readonly Button[])[]): boolean {
    return this.isOnCombo(...combo) && this.isHeld();
  }

  isOn(button: Button): boolean {
    const mask = Button.Bit[button];
    return (this.buttons & mask) == mask;
  }

  isOnStart(button: Button): boolean {
    return this.isOn(button) && this.isStart(button);
  }

  isOnHeld(button: Button): boolean {
    return this.isOn(button) && this.isHeld();
  }

  isOff(button: Button): boolean {
    return !this.isOn(button);
  }

  isOffStart(button: Button): boolean {
    return this.isOff(button) && this.isStart(button);
  }

  isOffHeld(button: Button): boolean {
    return this.isOff(button) && this.isHeld();
  }

  /** True if triggered on or off. */
  isStart(button: Button): boolean {
    const mask = Button.Bit[button];
    return this.#duration == 0 &&
      (this.buttons & mask) != (this.#prevButtons & mask);
  }

  isHeld(): boolean {
    return this.#duration >= 300;
  }

  preupdate(): void {
    this.#poller.preupdate();
    if (
      this.#duration > maxInterval &&
      (this.buttons == 0n || this.buttons != this.#prevButtons)
    ) {
      // Expired.
      this.#duration = 0;
      this.#combo.length = 0;
      // If any button is pressed, start a new combo.
      if (this.buttons != 0n) this.#combo.push(this.buttons);
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
