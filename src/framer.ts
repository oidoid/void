import type {Millis, OriginMillis} from './types/time.ts'

// to-do: rename looper or is that a higher order component?
/**
 * requests frames except when hidden. frames are requested even when idle to
 * poll gamepads.
 */
export class Framer {
  /** duration of frames observed. */
  age: Millis = 0 as Millis
  /** update input, update canvas, update cam, update world, then render. */
  onFrame: ((millis: Millis) => void) | undefined
  #req: number = 0
  #issued: OriginMillis = 0 as OriginMillis // to-do: init on start and add discard negative values.

  register(op: 'add' | 'remove'): this {
    const fn = `${op}EventListener` as const
    document[fn]('visibilitychange', this.#onVisibility)
    if (op === 'add') this.#resume()
    else this.#pause()
    return this
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onFrame = (now: OriginMillis): void => {
    const millis = (now - this.#issued) as Millis
    this.#issued = now
    this.age = (this.age + millis) as Millis
    this.#resume() // call before in case onFrame() unregisters.
    this.onFrame?.(millis)
  }

  #onVisibility = (ev: Event): void => {
    if (!ev.isTrusted) return
    if (document.hidden) this.#pause()
    else this.#resume()
  }

  // to-do: console.debug() lifecycles.
  #pause(): void {
    cancelAnimationFrame(this.#req)
  }

  #resume(): void {
    this.#req = requestAnimationFrame(this.#onFrame as FrameRequestCallback)
  }
}
