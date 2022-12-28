import { I16Box, I16XY, I32, NumberXY } from '@/oidlib';
import {
  Button,
  PointerInput,
  pointerMap,
  PointerType,
  Viewport,
} from '@/void';

export class PointerPoller {
  #cam: Readonly<I16Box>;
  #clientViewportWH: Readonly<NumberXY>;
  #input: PointerInput;

  get input(): PointerInput {
    return this.#input;
  }

  constructor() {
    const now = performance.now();
    this.#input = new PointerInput(0, I32(0), now, 'Mouse', now, I16XY(0, 0));
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

    // There's no off event for point. Clear it whenever there's no other button
    // on.
    if (this.#input.buttons == Button.toBit.Point) {
      this.#input = new PointerInput(
        this.#input.duration,
        I32(0),
        this.#input.created,
        'Mouse',
        this.#input.received,
        this.#input.xy,
      );
    } else this.#input.postupdate(delta);
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
    const active = ev.type == 'contextmenu' || ev.type == 'pointerdown';
    if (active) ev.preventDefault();
  };

  #eventToInput(
    ev: PointerEvent,
    received: DOMHighResTimeStamp,
  ): PointerInput {
    const clientXY = NumberXY(ev.clientX, ev.clientY);
    const xy = Viewport.toLevelXY(clientXY, this.#clientViewportWH, this.#cam);

    // Discard the event.
    if (ev.type == 'pointercancel') {
      return new PointerInput(0, I32(0), ev.timeStamp, 'Mouse', received, xy);
    }

    // The buttons change on down and up events kicking off a new timer. Move
    // events keep any prior event's timer.
    const duration = ev.type == 'pointerdown' || ev.type == 'pointerup'
      ? 0
      : this.#input?.duration ?? 0;
    return new PointerInput(
      duration,
      pointerButtonsToButtons(ev.buttons),
      ev.timeStamp,
      PointerType.parse(ev.pointerType),
      received,
      xy,
    );
  }
}

// Assumed to be Button not Direction.
function pointerButtonsToButtons(buttons: number): I32 {
  let mapped: number = Button.toBit.Point; // Any event is a point.
  for (let button = 1; button <= buttons; button = button << 1) {
    const fn = pointerMap[button];
    if (fn == null) continue;
    mapped = mapped | Button.toBit[fn];
  }
  return I32(mapped);
}
