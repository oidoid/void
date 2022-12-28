import { I32 } from '@/oidlib';
import {
  Button,
  Direction,
  KeyboardButtonInput,
  KeyboardDirectionInput,
  keyboardMap,
} from '@/void';

export class KeyboardPoller {
  #button: KeyboardButtonInput;
  #direction: KeyboardDirectionInput;

  get button(): KeyboardButtonInput {
    return this.#button;
  }

  get direction(): KeyboardDirectionInput {
    return this.#direction;
  }

  constructor() {
    const now = performance.now();
    this.#button = new KeyboardButtonInput(0, I32(0), now, now);
    this.#direction = new KeyboardDirectionInput(0, now, I32(0), now);
  }

  /**
   * Call this function *after* processing the collected input. This function
   * primes the poller to collect input for the next frame so it should occur
   * towards the end of the game update loop *after* entity processing.
   */
  postupdate(delta: number): void {
    this.#button.postupdate(delta);
    this.#direction.postupdate(delta);
  }

  register(window: Window, op: 'add' | 'remove'): void {
    for (const type of ['keydown', 'keyup']) {
      const fn = `${op}EventListener` as const;
      window[fn](type, <EventListenerOrEventListenerObject> this.#onEvent, {
        capture: true,
        passive: true,
      });
    }
  }

  #onEvent = (ev: KeyboardEvent): void => {
    const on = ev.type == 'keydown';
    const key = eventToKey(ev);
    this.#button = new KeyboardButtonInput(
      0,
      keyboardButtonsToButton(this.#button.buttons, key, on),
      ev.timeStamp,
      performance.now(),
    );
    this.#direction = new KeyboardDirectionInput(
      0,
      ev.timeStamp,
      keyboardButtonsToDirection(this.#direction.directions, key, on),
      performance.now(),
    );
    console.log(this.#button, this.#direction);
  };
}

function eventToKey(ev: KeyboardEvent): string {
  const meta = ev.metaKey ? 'Meta+' : '';
  const ctrl = ev.ctrlKey ? 'Control+' : '';
  const alt = ev.altKey ? 'Alt+' : '';
  const shift = ev.shiftKey ? 'Shift+' : '';
  return meta + ctrl + alt + shift + ev.key;
}

function keyboardButtonsToButton(buttons: I32, key: string, on: boolean): I32 {
  const fn = keyboardMap[key];
  if (fn == null) return buttons;
  if (Button.is(fn)) {
    const bit = Button.toBit[fn];
    return on ? I32(buttons | bit) : I32(buttons & ~bit);
  }
  return buttons;
}

function keyboardButtonsToDirection(
  directions: I32,
  key: string,
  on: boolean,
): I32 {
  const fn = keyboardMap[key];
  if (fn == null) return directions;
  if (Direction.is(fn)) {
    const bit = Direction.toBit[fn];
    return on ? I32(directions | bit) : I32(directions & ~bit);
  }
  return directions;
}
