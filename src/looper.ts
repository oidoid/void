import type {Millis} from './types/time.ts'
import {debug} from './utils/debug.ts'

/**
 * frame manager. passes frame requests when not hidden. callers should request
 * frames when an update occurs or a check for an update occurs. eg, gamepads
 * must be polled.
 *
 * when registered, restoring visibility triggers an automatic request.
 */
export class Looper {
  /** duration of frames observed. */
  age: Millis = 0
  onFrame: ((millis: Millis) => void) | undefined
  #req: number = 0
  #registered: boolean = false
  #start: Millis = 0

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
    this.#start = performance.now()
    this.#req = requestAnimationFrame(this.#onFrame)
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #cancel(): void {
    if (this.#req) cancelAnimationFrame(this.#req)
    this.#req = 0
  }

  #onFrame = (): void => {
    const now = performance.now()
    const millis = (now - this.#start) as Millis
    this.age = now
    this.#req = 0
    this.onFrame?.(millis)
  }

  #onVisibility = (ev: Event): void => {
    if (!ev.isTrusted) return
    if (document.hidden) {
      this.#cancel()
      if (debug?.looper) console.debug('[looper] paused')
    } else {
      this.requestFrame()
      if (debug?.looper) console.debug('[looper] resumed')
    }
  }
}
