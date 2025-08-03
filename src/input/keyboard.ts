export class Keyboard {
  /** KeyboardEvent.code to bit. */
  readonly bitByCode: {[code: string]: number} = {}
  /** KeyboardEvent.code to state. Multiple keys may map to the same bit. */
  #on: {[code: string]: boolean} = {}
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  get bits(): number {
    let bits = 0
    for (const k in this.bitByCode) bits |= this.#on[k] ? this.bitByCode[k]! : 0
    return bits
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    for (const ev of ['keydown', 'keyup']) fn(ev, this.#onKey as EventListener)
    return this
  }

  reset(): void {
    this.#on = {}
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onKey = (ev: KeyboardEvent): void => {
    // ignore untrusted and unknown; super is for OS.
    if (!ev.isTrusted || this.bitByCode[ev.code] == null || ev.metaKey) return
    this.#on[ev.code] = ev.type === 'keydown'
    ev.preventDefault()
  }
}
