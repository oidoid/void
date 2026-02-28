import type {Millis} from './types/time.ts'
import {debug} from './utils/debug.ts'

export type LoopReason = 'Poll' | 'Render'

export class Looper {
  /** duration of frames observed. */
  age: Millis = 0
  /** when frame arrived in . */
  frameStart: Millis = 0
  onFrame:
    | ((millis: Millis, reason: LoopReason) => 'Skip' | undefined)
    | undefined
  #reason: LoopReason = 'Render'
  #req: number = 0
  #registered: boolean = false
  /** when the frame was requested. */
  #requested: Millis = 0

  register(op: 'add' | 'remove'): this {
    const fn = `${op}EventListener` as const
    document[fn]('visibilitychange', this.#onVisibility)
    if (op === 'remove') this.#cancel()
    // try to let user drive initial frame since assets may be loading.
    this.#registered = op === 'add'
    return this
  }

  requestFrame(reason: LoopReason): void {
    this.#reason = this.#reason === 'Render' ? this.#reason : reason
    if (this.#req || document.hidden || !this.#registered) return
    this.#requested = performance.now()
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
    this.frameStart = performance.now()
    const millis = (this.frameStart - this.#requested) as Millis
    this.#req = 0
    this.age += millis
    const reason = this.#reason
    this.#reason = 'Poll'
    if (this.onFrame && this.onFrame(millis, reason) === 'Skip')
      this.age -= millis
  }

  #onVisibility = (ev: Event): void => {
    if (!ev.isTrusted) return
    if (document.hidden) {
      this.#cancel()
      if (debug?.looper) console.debug('[looper] paused')
    } else {
      this.requestFrame('Poll')
      if (debug?.looper) console.debug('[looper] resumed')
    }
  }
}
