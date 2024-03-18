export class KeyboardPoller {
  #bits = 0
  readonly #bitByKey: { [key: string]: number } = {}

  get bits(): number {
    return this.#bits
  }

  map(key: string, bit: number): void {
    this.#bitByKey[key] = bit
  }

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const
    // keyup is not received if window loses focus.
    globalThis[fn]('blur', this.reset, { capture: true, passive: true })
    for (const type of ['keydown', 'keyup']) {
      const callback = <EventListenerOrEventListenerObject> this.#onKey
      globalThis[fn](type, callback, { capture: true, passive: true })
    }
  }

  reset = (): void => {
    this.#bits = 0
  }

  #onKey = (ev: KeyboardEvent): void => {
    const on = ev.type === 'keydown'
    const bit = this.#bitByKey[ev.key]
    if (bit == null) return
    this.#bits = on ? (this.#bits | bit) : (this.#bits & ~bit)
  }
}
