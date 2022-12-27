import { I16Box, I16XY, I32, NumberXY } from '@/oidlib';
import { PointerButton, PointerInput, PointerType, Viewport } from '@/void';

export class PointerPoller {
  #cam: Readonly<I16Box>;
  #clientViewportWH: Readonly<NumberXY>;
  #pointer?: PointerInput | undefined;

  get pointer(): PointerInput | undefined {
    return this.#pointer;
  }

  get pointerType(): PointerType | undefined {
    return this.#pointer?.pointerType;
  }

  get xy(): I16XY | undefined {
    return this.#pointer?.xy;
  }

  /** True if triggered. */
  get #start(): boolean {
    return this.#pointer?.duration == 0;
  }

  get #long(): boolean {
    return (this.#pointer?.duration ?? 0) > 400;
  }

  constructor() {
    // Initialize to 1x1 dimensions to avoid division by zero.
    this.#cam = I16Box(0, 0, 1, 1);
    this.#clientViewportWH = NumberXY(1, 1);
  }

  on(button: PointerButton): boolean {
    // PointerButton.Point is zero since it has no button states. However, when
    // there's no pointer event state, "on" should always be false.
    if (this.#pointer == null) return false;

    const mask = PointerButton.toBit[button];
    return (this.#pointer.buttons & mask) == mask;
  }

  onStart(button: PointerButton): boolean {
    return this.#start && this.on(button);
  }

  onLong(button: PointerButton): boolean {
    return this.#long && this.on(button);
  }

  off(button: PointerButton): boolean {
    return !this.on(button);
  }

  offStart(button: PointerButton): boolean {
    return this.off(button) && this.#start;
  }

  offLong(button: PointerButton): boolean {
    return this.off(button) && this.#long;
  }

  // what should this API be??
  // mask API changes, number api changes

  // on
  // off
  // onTrigger
  // offTrigger
  // onLong
  // offLong
  // onCombo / onTriggerCombo: B[][] [[Up,Left], [Down]] i guess htis could have off too and long.
  // point is super weird: it's continuous (?), it has an XY, there's no button
  // for it. it's more line an event.

  // on2(_combo: B[][], ..._types: PointerType[]): boolean {
  //   return false;
  // }

  // ono(button: B, ...types: PointerType[]): boolean;
  // ono(button0: B, button1: B, ...types: PointerType[]): boolean;
  // ono(button0: B, button1: B, button2: B, ...types: PointerType[]): boolean;
  // ono(
  //   button0: B,
  //   button1: B,
  //   button2: B,
  //   button3: B,
  //   ...types: PointerType[]
  // ): boolean;
  // ono(
  //   button0: B,
  //   button1: B,
  //   button2: B,
  //   button3: B,
  //   button4: B,
  //   ...types: PointerType[]
  // ): boolean;
  // ono(
  //   button0: B,
  //   button1: B,
  //   button2: B,
  //   button3: B,
  //   button4: B,
  //   button5: B,
  //   ...types: PointerType[]
  // ): boolean;
  // ono(
  //   button0: B,
  //   button1: B,
  //   button2: B,
  //   button3: B,
  //   button4: B,
  //   button5: B,
  //   button6: B,
  //   ...types: PointerType[]
  // ): boolean;
  // ono(
  //   button0: B,
  //   button1: B,
  //   button2: B,
  //   button3: B,
  //   button4: B,
  //   button5: B,
  //   button7: B,
  //   ...types: PointerType[]
  // ): boolean;
  // ono(
  //   _button0: B,
  //   ..._types: unknown[]
  // ): boolean {
  //   return false;
  // }

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
    this.#clientViewportWH = clientViewportWH;
    this.#cam = cam;

    // If there any existing pointer state, update the duration.
    this.#pointer = this.#pointer == null || this.#pointer.buttons == 0
      ? undefined
      : {
        buttons: I32(this.#pointer.buttons),
        created: this.#pointer.created,
        duration: this.#pointer.duration + delta,
        pointerType: this.#pointer.pointerType,
        received: this.#pointer.received,
        xy: this.#pointer.xy,
      };
  }

  register(window: Window, op: 'add' | 'remove'): void {
    const types = [
      'contextmenu',
      'pointercancel',
      'pointerdown',
      'pointermove',
      'pointerup',
    ];
    for (const type of types) {
      const fn = `${op}EventListener` as const;
      const passive = type != 'contextmenu' && type != 'pointerdown';
      window[fn](type, this.#onEvent, { capture: true, passive });
    }
  }

  #onEvent = (ev: PointerEvent | Event): void => {
    const received = performance.now();
    const pointer = ev.type != 'contextmenu';
    if (pointer) {
      this.#pointer = this.#eventToInput(<PointerEvent> ev, received);
    }
    const passive = ev.type == 'contextmenu' || ev.type == 'pointerdown';
    if (passive) ev.preventDefault();
  };

  #eventToInput(
    ev: PointerEvent,
    received: DOMHighResTimeStamp,
  ): PointerInput | undefined {
    // Discard the event.
    if (ev.type == 'pointercancel') return;

    // The buttons change on down and up events kicking off a new timer. Move
    // events keep any prior event's timer.
    const duration = ev.type == 'pointerdown' || ev.type == 'pointerup'
      ? 0
      : this.#pointer?.duration ?? 0;

    const clientXY = NumberXY(ev.clientX, ev.clientY);
    return {
      buttons: I32(ev.buttons),
      created: ev.timeStamp,
      duration,
      pointerType: PointerType.parse(ev.pointerType),
      received,
      xy: Viewport.toLevelXY(clientXY, this.#clientViewportWH, this.#cam),
    };
  }
}
