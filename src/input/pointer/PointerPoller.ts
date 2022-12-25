import { I16Box, I32, NumberXY } from '@/oidlib';
import { PointerInput, PointerState, PointerType, Viewport } from '@/void';

export class PointerPoller {
  readonly #state: PointerState;
  #clientViewportWH: Readonly<NumberXY>;
  #cam: Readonly<I16Box>;

  get state(): PointerState {
    return this.#state;
  }

  constructor() {
    this.#state = new PointerState();
    // Initialize to 1x1 dimensions to avoid division by zero.
    this.#clientViewportWH = NumberXY(1, 1);
    this.#cam = I16Box(0, 0, 1, 1);
  }

  /** Call this function *after* processing the collected input. This function
      primes the poller to collect input for the next frame so it should occur
      towards the end of the game update loop *after* entity processing. */
  update(
    delta: number,
    clientViewportWH: Readonly<NumberXY>,
    cam: Readonly<I16Box>,
  ): void {
    this.#clientViewportWH = clientViewportWH;
    this.#cam = cam;
    this.#state.update(delta);
  }

  register(window: Window, op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const;
    const types = [
      'contextmenu',
      'pointerup',
      'pointermove',
      'pointerdown',
      'pointercancel',
    ] as const;
    for (const type of types) {
      window[fn](type, <EventListener> this.#onEvent, {
        capture: true,
        passive: type != 'contextmenu' && type != 'pointerdown',
        // passive: type != 'pointerdown',
      });
    }
  }

  #onEvent = (ev: PointerEvent): void => {
    const received = performance.now();
    if (ev.type != 'contextmenu') {
      this.#state.point = this.#eventToPoint(ev, received);
    }
    if (ev.type != 'contextmenu') {
      this.#state.pick = this.#eventToPick(ev, received);
    }
    // event.stopImmediatePropagation();
    if (ev.type == 'contextmenu' || ev.type == 'pointerdown') {
      // if (event.type == 'pointerdown')
      ev.preventDefault();
    }
  };

  #eventToPoint(
    ev: PointerEvent,
    received: DOMHighResTimeStamp,
  ): PointerInput | undefined {
    if (ev.type == 'pointercancel') return;
    const active = ev.type == 'pointermove' || ev.type == 'pointerdown';
    const { point } = this.#state;
    const timer = point == null ? 1 : point.active != active ? 0 : point.timer;
    const windowXY = NumberXY(ev.clientX, ev.clientY);
    const pointerType = PointerType.parse(ev.pointerType);
    return new PointerInput(
      active,
      I32(ev.buttons),
      ev.timeStamp,
      pointerType,
      received,
      timer,
      windowXY,
      Viewport.toLevelXY(windowXY, this.#clientViewportWH, this.#cam),
    );
  }

  #eventToPick(
    ev: PointerEvent,
    received: DOMHighResTimeStamp,
  ): PointerInput | undefined {
    if (ev.type == 'pointercancel') return;
    const { pick } = this.#state;
    const active = ev.type == 'pointerdown' ||
      ev.type == 'pointermove' && pick?.active == true; // Require all pick moves to start with an active click.
    const timer = pick == null ? 1 : pick.active != active ? 0 : pick.timer;
    const windowXY = NumberXY(ev.clientX, ev.clientY);
    const pointerType = PointerType.parse(ev.pointerType);
    return new PointerInput(
      active,
      I32(ev.buttons),
      ev.timeStamp,
      pointerType,
      received,
      timer,
      windowXY,
      Viewport.toLevelXY(windowXY, this.#clientViewportWH, this.#cam),
    );
  }
}
