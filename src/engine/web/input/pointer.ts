import type { AnyEvent, OnEvent } from '../event.js'

export type PointerDevice = (typeof PointerDevice)[keyof typeof PointerDevice]
const PointerDevice = { Unknown: 0, Mouse: 1, Pen: 2, Touch: 3 } as const
const pointerDevice: Record<string, PointerDevice> = {
  mouse: PointerDevice.Mouse,
  pen: PointerDevice.Pen,
  touch: PointerDevice.Touch,
}

export class Pointer {
  /**
   * pointer ID; -1 if nonpointing device (eg, a click event fired on a button
   * activated via keyboard).
   */
  id: number = 0
  /** x coord in client pixels from top-left; readonly. */
  x: number = 0
  /** y coord in client pixels from top-left; readonly. */
  y: number = 0
  /** contact width in client pixels. */
  w: number = 0
  /** contact height in client pixels. */
  h: number = 0
  /** normalized pressure in [0, 1]. */
  pressure: number = 0
  /** pen x-axis tilt from the screen plane in [-90°, 90°]. */
  tiltX: number = 0
  /** pen y-axis tilt from the screen plane in [-90°, 90°]. */
  tiltY: number = 0
  /** pen rotation around its axis in degrees [0, 359]. */
  twist: number = 0
  device: PointerDevice = 0
  /** true if this is the primary pointer. */
  primary: boolean = false
  /**
   * bitmask of buttons pressed: 1 primary (left); 2 secondary (right);
   * 4 auxiliary (middle), 8 back, 16 forward.
   */
  buttons: number = 0
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
    this.w = ev.width
    this.h = ev.height
    this.pressure = ev.pressure
    this.tiltX = ev.tiltX
    this.tiltY = ev.tiltY
    this.twist = ev.twist
    this.device = pointerDevice[ev.pointerType] ?? PointerDevice.Unknown
    this.primary = ev.isPrimary
    this.buttons = ev.buttons
    this.onEvent(`input-${ev.type}` as AnyEvent)
  }
}
