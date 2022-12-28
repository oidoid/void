import { I16Box, I16XY, NumberXY } from '@/oidlib';
import { Button, InputPoller, PointerType } from '@/void';

export class Input {
  readonly #poller: InputPoller;
  #prevButtons: bigint;
  duration: number = 0;

  get pointerType(): PointerType | undefined {
    return this.#poller.pointerType;
  }

  get xy(): I16XY | undefined {
    return this.#poller.xy;
  }

  constructor() {
    this.#poller = new InputPoller();
    this.#prevButtons = 0n;
  }

  isOn(button: Button): boolean {
    const mask = Button.Bit[button];
    return (this.#poller.sample & mask) == mask;
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

  isStart(button: Button): boolean {
    const mask = Button.Bit[button];
    return this.duration == 0 &&
      (this.#poller.sample & mask) != (this.#prevButtons & mask);
  }

  isHeld(): boolean {
    return this.duration >= 300;
  }

  preupdate(): void {
    this.#poller.preupdate();
    if (this.#poller.sample != this.#prevButtons) {
      this.duration = 0;
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
    this.duration += delta;
    this.#prevButtons = this.#poller.sample;
  }

  register(op: 'add' | 'remove'): void {
    this.#poller.register(op);
  }

  reset(): void {
    this.#poller.reset();
  }
}
