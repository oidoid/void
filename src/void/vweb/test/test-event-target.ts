/** dispatches plain object events; see `TestEvent()`. */
export class TestEventTarget implements EventTarget {
  readonly #listeners: {
    [type: string]: Set<EventListenerOrEventListenerObject>
  } = {}

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    ;(this.#listeners[type] ??= new Set()).add(listener)
  }

  dispatchEvent(ev: Event): boolean {
    for (const listener of this.#listeners[ev.type] ?? [])
      if (typeof listener === 'function') listener.call(this, ev)
      else listener.handleEvent(ev)
    return !ev.defaultPrevented
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void {
    this.#listeners[type]?.delete(listener)
  }
}
