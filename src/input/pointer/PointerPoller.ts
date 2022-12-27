import { I16Box, I32, NumberXY } from '@/oidlib';
import { PointerInput, PointerType, Viewport } from '@/void';

export class PointerPoller {
  #cam: Readonly<I16Box>;
  #clientViewportWH: Readonly<NumberXY>;
  #input?: PointerInput | undefined;

  get input(): PointerInput | undefined {
    return this.#input;
  }

  constructor() {
    // Initialize to 1x1 dimensions to avoid division by zero.
    this.#cam = I16Box(0, 0, 1, 1);
    this.#clientViewportWH = NumberXY(1, 1);
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
    this.#clientViewportWH = clientViewportWH;
    this.#cam = cam;

    // If there any existing pointer state, update the duration.
    this.#input = this.#input == null || this.#input.buttons == 0
      ? undefined
      : new PointerInput(
        this.#input.duration + delta,
        I32(this.#input.buttons),
        this.#input.created,
        this.#input.pointerType,
        this.#input.received,
        this.#input.xy,
      );
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
      this.#input = this.#eventToInput(<PointerEvent> ev, received);
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
      : this.#input?.duration ?? 0;

    const clientXY = NumberXY(ev.clientX, ev.clientY);
    return new PointerInput(
      duration,
      I32(ev.buttons),
      ev.timeStamp,
      PointerType.parse(ev.pointerType),
      received,
      Viewport.toLevelXY(clientXY, this.#clientViewportWH, this.#cam),
    );
  }
}
