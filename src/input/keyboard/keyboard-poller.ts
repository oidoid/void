import { Uint } from '@/ooz'
import { Button, keyboardMap } from '@/void'

export class KeyboardPoller {
  #buttons: Uint = Uint(0)

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const
    globalThis[fn]('blur', this.#onBlurEvent, { capture: true, passive: true })
    for (const type of ['keydown', 'keyup']) {
      const callback = <EventListenerOrEventListenerObject> this.#onKeyEvent
      globalThis[fn](type, callback, { capture: true, passive: true })
    }
  }

  reset(): void {
    this.#buttons = Uint(0)
  }

  get sample(): Uint {
    return this.#buttons
  }

  #onBlurEvent = (): void => {
    // keyup is not received if window loses focus first. This is like
    // pointercancel.
    this.#buttons = Uint(0)
  }

  #onKeyEvent = (ev: KeyboardEvent): void => {
    const on = ev.type == 'keydown'
    for (const key of eventToKeys(ev)) {
      this.#buttons = keyToButton(this.#buttons, key, on)
    }
  }
}

function eventToKeys(ev: Readonly<KeyboardEvent>): Set<string> {
  const meta = ev.metaKey ? 'Meta+' : ''
  const ctrl = ev.ctrlKey ? 'Ctrl+' : ''
  const alt = ev.altKey ? 'Alt+' : ''
  const shift = ev.shiftKey ? 'Shift+' : ''

  // There is only one key per keydown event.
  if (ev.type == 'keydown') {
    return new Set([meta + ctrl + alt + shift + ev.key])
  }

  // keyup events fanout to all variations since only one event is received.
  // Don't care if this clears bits never set.
  return new Set([
    meta + ctrl + alt + shift + ev.key,
    ctrl + alt + shift + ev.key,
    alt + shift + ev.key,
    shift + ev.key,
    ev.key,
  ])
}

function keyToButton(buttons: Uint, key: string, on: boolean): Uint {
  const fn = keyboardMap[key]
  if (fn == null) return buttons
  const bit = Button.Bit[fn]
  // to-do: use Uint-safe or / and / complement.
  return on ? Uint(buttons | bit) : Uint(buttons & ~bit)
}
