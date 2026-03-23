import type { OnEvent } from "../event"

export class Wheel {
  /** scroll delta X in client pixels; readonly. */
  deltaX: number = 0
  /** scroll delta Y in client pixels; readonly. */
  deltaY: number = 0
  /** scroll delta Z in client pixels; readonly. */
  deltaZ: number = 0
  onEvent: OnEvent = () => { }
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  postupdate(): void {
    this.deltaX = this.deltaY = this.deltaZ = 0
  }

  register(op: 'add' | 'remove'): this {
    this.#target[`${op}EventListener`]('wheel', this.#onWheel as EventListener, { passive: true })
    return this
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onWheel = (ev: WheelEvent): void => {
    // note: visual viewport magnification, a pinch on trackpad, dispatches a
    // wheel event. prevent default to disable that zoom mechanism.
    if (!ev.isTrusted || ev.metaKey || ev.altKey || ev.ctrlKey) return
    this.deltaX = ev.deltaX
    this.deltaY = ev.deltaY
    this.deltaZ = ev.deltaZ
    this.onEvent('input-wheel')
  }
}
