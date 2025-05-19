export class Keyboard {
  /** case-sensitive KeyboardEvent.key. */
  readonly bitByKey: {[key: string]: number} = {}
  bits: number = 0
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    for (const ev of ['keydown', 'keyup']) fn(ev, this.#onKey as EventListener)
    return this
  }

  reset(): void {
    this.bits = 0
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onKey = (ev: KeyboardEvent): void => {
    if (!ev.isTrusted && !globalThis.Deno) return
    const bit = this.bitByKey[ev.key]
    if (bit == null) return
    ev.preventDefault()
    this.bits = ev.type === 'keydown' ? this.bits | bit : this.bits & ~bit
  }
}
