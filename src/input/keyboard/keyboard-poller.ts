import { Button, keyboardMap } from '@/void';

export class KeyboardPoller {
  #buttons: bigint = 0n;

  get sample(): bigint {
    return this.#buttons;
  }

  reset(): void {
    this.#buttons = 0n;
  }

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const;
    window[fn]('blur', this.#onBlurEvent, { capture: true, passive: true });
    for (const type of ['keydown', 'keyup']) {
      const callback = <EventListenerOrEventListenerObject> this.#onKeyEvent;
      window[fn](type, callback, { capture: true, passive: true });
    }
  }

  #onBlurEvent = (): void => {
    // keyup is not received if window loses focus first. This is like
    // pointercancel.
    this.#buttons = 0n;
  };

  #onKeyEvent = (ev: KeyboardEvent): void => {
    const on = ev.type == 'keydown';
    for (const key of eventToKeys(ev)) {
      this.#buttons = keyToButton(this.#buttons, key, on);
    }
  };
}

function eventToKeys(ev: Readonly<KeyboardEvent>): Set<string> {
  const meta = ev.metaKey ? 'Meta+' : '';
  const ctrl = ev.ctrlKey ? 'Ctrl+' : '';
  const alt = ev.altKey ? 'Alt+' : '';
  const shift = ev.shiftKey ? 'Shift+' : '';

  // There is only one key per keydown event.
  if (ev.type == 'keydown') {
    return new Set([meta + ctrl + alt + shift + ev.key]);
  }

  // keyup events fanout to all variations since only one event is received.
  return new Set([
    meta + ctrl + alt + shift + ev.key,
    ctrl + alt + shift + ev.key,
    alt + shift + ev.key,
    shift + ev.key,
    ev.key,
  ]);
}

function keyToButton(buttons: bigint, key: string, on: boolean): bigint {
  const fn = keyboardMap[key];
  if (fn == null) return buttons;
  const bit = Button.Bit[fn];
  return on ? (buttons | bit) : (buttons & ~bit);
}
