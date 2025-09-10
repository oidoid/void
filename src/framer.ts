import type {Millis, OriginMillis} from './types/time.ts'

// to-do: move to graphics/.
// to-do: rename looper or is that a higher order component?
/**
 * requests frames except when hidden. frames are requested even when idle to
 * poll gamepads.
 * autoloop?
 */
export class Framer {
  /** duration of frames observed. */
  age: OriginMillis = 0 as OriginMillis
  /**
   * update input, update canvas, update cam, update world, then render.
   * to-do: encapsulate^.
   */
  onFrame: ((millis: Millis) => void) | undefined
  #req: number = 0
  #registered: boolean = false

  register(op: 'add' | 'remove'): this {
    const fn = `${op}EventListener` as const
    document[fn]('visibilitychange', this.#onVisibility)
    if (op === 'remove') this.#cancel()
    // try to let user drive initial frame since assets may be loading.
    this.#registered = op === 'add'
    return this
  }

  requestFrame(): void {
    if (this.#req || document.hidden || !this.#registered) return
    this.#req = requestAnimationFrame(this.#onFrame as FrameRequestCallback)
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #cancel(): void {
    if (this.#req) cancelAnimationFrame(this.#req)
    this.#req = 0
  }

  #onFrame = (now: OriginMillis): void => {
    this.age = now
    this.#req = 0
    this.onFrame?.((now - (this.age || now)) as Millis)
  }

  #onVisibility = (ev: Event): void => {
    if (!ev.isTrusted) return
    if (document.hidden) this.#cancel()
    else this.requestFrame()
  }
}
