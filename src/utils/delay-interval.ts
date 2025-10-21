import type {Millis} from '../types/time.ts'

export class DelayInterval {
  #delay: () => Millis
  #interval: Millis
  #intervalID: number = 0
  #onInterval: () => void
  #timerID: number = 0

  constructor(delay: () => Millis, interval: Millis, onInterval: () => void) {
    this.#delay = delay
    this.#interval = interval
    this.#onInterval = onInterval
  }

  register(op: 'add' | 'remove'): this {
    if (op === 'add') {
      this.#timerID = setTimeout(() => {
        this.#onInterval()
        this.#intervalID = setInterval(this.#onInterval, this.#interval)
      }, this.#delay())
    } else {
      clearTimeout(this.#timerID)
      clearInterval(this.#intervalID)
    }

    return this
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }
}
