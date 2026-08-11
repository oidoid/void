import type {OnEvent} from '../engine/event.ts'

export class Wheel {
  /** scroll delta X in client pixels; readonly. */
  deltaX: number = 0
  /** scroll delta Y in client pixels; readonly. */
  deltaY: number = 0
  /** scroll delta Z in client pixels; readonly. */
  deltaZ: number = 0
  /** signed trackpad pinch delta in client pixels. */
  pinch: number = 0
  onEvent: OnEvent = () => {}
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  postupdate(): void {
    this.deltaX = this.deltaY = this.deltaZ = this.pinch = 0
  }

  register(op: 'add' | 'remove'): this {
    this.#target[`${op}EventListener`](
      'wheel',
      this.#onWheel as EventListener,
      {passive: false}
    )
    return this
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onWheel = (ev: WheelEvent): void => {
    if (!ev.isTrusted || ev.metaKey || ev.altKey) return
    if (ev.ctrlKey) {
      // note: visual viewport magnification, a pinch on trackpad, dispatches a
      // wheel event. prevent default to disable that zoom mechanism.
      ev.preventDefault()
      this.pinch += ev.deltaY
      this.onEvent('input-wheel')
      return
    }
    this.deltaX = ev.deltaX
    this.deltaY = ev.deltaY
    this.deltaZ = ev.deltaZ
    this.onEvent('input-wheel')
  }
}
