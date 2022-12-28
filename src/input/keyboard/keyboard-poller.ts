import { I32 } from '@/oidlib';
import {
  Button,
  Direction,
  KeyboardButtonInput,
  KeyboardDirectionInput,
  keyboardMap,
} from '@/void';

// combine direction and button
// record buttons and directions from all sources as a single I32
// on post-update, if bits changed, start a new entry,otherwise update current. if execeeds max interval, expire combo

interface State {
  button: KeyboardButtonInput;
  direction: KeyboardDirectionInput;
}

export class KeyboardPoller {
  #prev: State;
  #cur: State;

  get button(): KeyboardButtonInput {
    return this.#cur.button;
  }

  get direction(): KeyboardDirectionInput {
    return this.#cur.direction;
  }

  get prevButton(): KeyboardButtonInput {
    return this.#prev.button;
  }

  get prevDirection(): KeyboardDirectionInput {
    return this.#prev.direction;
  }

  constructor() {
    const now = performance.now();
    this.#prev = {
      button: new KeyboardButtonInput(0, I32(0), now, now),
      direction: new KeyboardDirectionInput(0, now, I32(0), now),
    };
    this.#cur = {
      button: new KeyboardButtonInput(0, I32(0), now, now),
      direction: new KeyboardDirectionInput(0, now, I32(0), now),
    };
  }

  /**
   * Call this function *after* processing the collected input. This function
   * primes the poller to collect input for the next frame so it should occur
   * towards the end of the game update loop *after* entity processing.
   */
  postupdate(delta: number): void {
    this.#cur.button.postupdate(delta);
    this.#cur.direction.postupdate(delta);
    this.#prev = this.#cur;
    this.#cur = {
      button: new KeyboardButtonInput(
        this.#cur.button.duration,
        this.#cur.button.buttons,
        this.#cur.button.created,
        this.#cur.button.received,
      ),
      direction: new KeyboardDirectionInput(
        this.#cur.direction.duration,
        this.#cur.direction.created,
        this.#cur.direction.directions,
        this.#cur.direction.received,
      ),
    };
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
    this.#cur.button = new KeyboardButtonInput(
      0,
      keyboardButtonsToButton(this.#cur.button.buttons, key, on),
      ev.timeStamp,
      performance.now(),
    );
    this.#cur.direction = new KeyboardDirectionInput(
      0,
      ev.timeStamp,
      keyboardButtonsToDirection(this.#cur.direction.directions, key, on),
      performance.now(),
    );
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
