import type {Millis} from './types/time.ts'

/**
 * requests frames except when hidden. frames are requested even when idle to
 * poll gamepads.
 */
export class Framer {
  /** milliseconds rendered. */
  age: Millis = 0 as Millis
  /** frames rendered. */
  frame: number = 0
  /** only millis since frame request not since last frame. */
  onFrame: ((millis: Millis) => void) | undefined
  #req: number = 0

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

  #onFrame = (millis: Millis): void => {
    this.age = (this.age + millis) as Millis
    this.frame++
    this.#resume() // call before in case onFrame() unregisters.
    this.onFrame?.(millis)
  }

  #onVisibility = (ev: Event): void => {
    if (!ev.isTrusted) return
    // ev.preventDefault()
    if (document.hidden) this.#pause()
    else this.#resume()
  }

  #pause(): void {
    cancelAnimationFrame(this.#req)
  }

  #resume(): void {
    this.#req = requestAnimationFrame(this.#onFrame as FrameRequestCallback)
  }
}
