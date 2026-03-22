import type { OnEvent } from "../event"

export class Wheel {
  /** scroll delta X in pixels; readonly. */
  x: number = 0
  /** scroll delta Y in pixels; readonly. */
  y: number = 0
  /** scroll delta Z in pixels; readonly. */
  z: number = 0
  onEvent: OnEvent = () => { }
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  postupdate(): void {
    this.x = this.y = this.z = 0
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
    this.x = ev.deltaX
    this.y = ev.deltaY
    this.z = ev.deltaZ
    this.onEvent('input-wheel')
  }
}
