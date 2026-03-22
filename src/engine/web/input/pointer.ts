import type { AnyEvent, OnEvent } from '../event.js'

export type PointerDevice = (typeof PointerDevice)[keyof typeof PointerDevice]
const PointerDevice = { Unknown: 0, Mouse: 1, Pen: 2, Touch: 3 } as const

export type PointerEventType = (typeof PointerEventType)[keyof typeof PointerEventType]
const PointerEventType = { Cancel: 0, Down: 1, Move: 2, Up: 3 } as const


export class Pointer {
  /**
   * pointer ID; -1 if nonpointing device (eg, a click event fired on a button
   * activated via keyboard).
   */
  id: number = -1
  /** x coord in client pixels from top-left; readonly. */
  x: number = 0
  /** y coord in client pixels from top-left; readonly. */
  y: number = 0
  device: PointerDevice = 0
  eventType: PointerEventType = 0
  /**
   * bitmask of buttons pressed: 1: primary (left); 2: secondary (right)';
   * 4: auxiliary (middle), 8: back, 16: forward.
   */
  buttons: number = 0
  primary: boolean = false
  onEvent: OnEvent = () => { }
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  register(op: 'add' | 'remove'): void {
    for (const ev of ['pointercancel', 'pointerdown', 'pointermove', 'pointerup'])
      this.#target[`${op}EventListener`](ev, this.#onPointer as EventListener)
  }

  #onPointer = (ev: PointerEvent): void => {
    this.id = ev.pointerId
    this.x = ev.clientX
    this.y = ev.clientY
    this.device = (PointerDevice[ev.pointerType as keyof typeof PointerDevice] ?? PointerDevice.Unknown)
    this.eventType = (PointerEventType[ev.type as keyof typeof PointerEventType]!)
    this.buttons = ev.buttons
    this.primary = ev.isPrimary
    this.onEvent(`input-${ev.type}` as AnyEvent)
  }
}
