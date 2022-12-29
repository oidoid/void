import { I16Box, I16XY, NumberXY } from '@/oidlib';
import { Button, pointerMap, PointerType, Viewport } from '@/void';

export class PointerPoller {
  /** The button state of the most recent pointer. */
  #buttons: bigint;
  #cam: Readonly<I16Box>;
  #clientViewportWH: Readonly<NumberXY>;
  /** The pointer type of the most recent pointer. Undefined when canceled. */
  #pointerType?: PointerType | undefined;
  /** The level position of the most recent pointer. Undefined when canceled. */
  #xy?: I16XY | undefined;

  get pointerType(): PointerType | undefined {
    return this.#pointerType;
  }

  get sample(): bigint {
    return this.#buttons;
  }

  get xy(): I16XY | undefined {
    return this.#xy;
  }

  constructor() {
    this.#buttons = 0n;
    // Initialize to 1x1 dimensions to avoid division by zero.
    this.#cam = I16Box(0, 0, 1, 1);
    this.#clientViewportWH = NumberXY(1, 1);
  }

  postupdate(
    clientViewportWH: Readonly<NumberXY>,
    cam: Readonly<I16Box>,
  ): void {
    this.#clientViewportWH = clientViewportWH;
    this.#cam = cam;

    // pointerdown, pointermove, and pointerup events are all treated as
    // pointing but there's no event to clear the pointing state. If there's no
    // other button on, consider pointing off.
    if (this.#buttons == 0n || this.#buttons == Button.Bit.Point) this.reset();
  }

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const;
    window[fn]('pointercancel', this.reset, { capture: true, passive: true });
    const types = ['contextmenu', 'pointerdown', 'pointermove', 'pointerup'];
    for (const type of types) {
      const passive = type != 'contextmenu' && type != 'pointerdown';
      window[fn](type, this.#onPointEvent, { capture: true, passive });
    }
  }

  reset = (): void => {
    this.#buttons = 0n;
    this.#pointerType = undefined;
    this.#xy = undefined;
  };

  #onPointEvent = (ev: PointerEvent | Event): void => {
    if (ev.type != 'contextmenu') {
      const pointer = <PointerEvent> ev;
      this.#buttons = pointerButtonsToButton(pointer.buttons);
      this.#pointerType = PointerType.parse(pointer.pointerType);
      const clientXY = NumberXY(pointer.clientX, pointer.clientY);
      this.#xy = Viewport.toLevelXY(
        clientXY,
        this.#clientViewportWH,
        this.#cam,
      );
    }

    const active = ev.type == 'contextmenu' || ev.type == 'pointerdown';
    if (active) ev.preventDefault();
  };
}

function pointerButtonsToButton(buttons: number): bigint {
  let mapped: bigint = Button.Bit.Point; // All events are points.
  for (let button = 1; button <= buttons; button <<= 1) {
    if ((button & buttons) != button) continue;
    const fn = pointerMap[button];
    if (fn == null) continue;
    mapped |= Button.Bit[fn];
  }
  return mapped;
}
