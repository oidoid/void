import { I16XY, I32, NumberXY } from '@/oidlib';
import { PointerButton, PointerType } from '@/void';

// type B = keyof typeof PointerButton;

export class PointerInput {
  readonly pointerType: PointerType;
  /** True if input is on. */
  readonly active: boolean;
  /** Duration in state in milliseconds. 0 on state change. When 0 and active, triggered on. When 0 and inactive,
      triggered off. */
  #timer: number;
  /** The position of the input in window coordinates. Pointer state polling is
      simulated through events so level position must be recalculated through
      the camera lens of each frame. See xy. */
  readonly windowXY: NumberXY;
  readonly xy: I16XY;
  readonly #buttons: I32;
  // to-do: only care about whether i miss hte frame or not. if i miss it and i could have hit it, that seems like a big deal.
  readonly created: DOMHighResTimeStamp;
  readonly received: DOMHighResTimeStamp; // onEvent

  get triggered(): boolean {
    return this.#timer == 0;
  }

  get long(): boolean {
    return this.#timer > 500;
  }

  get timer(): number {
    return this.#timer;
  }

  constructor(
    active: boolean,
    buttons: I32,
    created: DOMHighResTimeStamp,
    pointerType: PointerType,
    received: DOMHighResTimeStamp,
    timer: number,
    windowXY: NumberXY,
    xy: I16XY,
  ) {
    this.windowXY = windowXY;
    this.pointerType = pointerType;
    this.active = active;
    this.#buttons = buttons;
    this.created = created;
    this.received = received;
    this.#timer = timer;
    this.xy = xy;
  }

  on(button: PointerButton): boolean {
    const mask = PointerButton.toBits[button];
    return this.active && (this.#buttons & mask) == mask;
  }

  onTriggered(button: PointerButton): boolean {
    return this.triggered && this.on(button);
  }

  onLong(button: PointerButton): boolean {
    return this.long && this.on(button);
  }

  off(button: PointerButton): boolean {
    const mask = PointerButton.toBits[button];
    return !this.active && (this.#buttons & mask) == 0;
  }

  offTriggered(button: PointerButton): boolean {
    return this.off(button) && this.triggered;
  }

  offLong(button: PointerButton): boolean {
    return this.on(button) && this.long;
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

  update(delta: number): void {
    this.#timer += delta;
  }
}
