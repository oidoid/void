import type {AnyEvent, OnEvent} from '../event.ts'

export type PointerDevice = (typeof PointerDevice)[keyof typeof PointerDevice]
const PointerDevice = {Unknown: 0, Mouse: 1, Pen: 2, Touch: 3} as const
const pointerDevice: Record<string, PointerDevice> = {
  mouse: PointerDevice.Mouse,
  pen: PointerDevice.Pen,
  touch: PointerDevice.Touch
}

export type PointerPoll = {
  /**
   * pointer ID; -1 if nonpointing device (eg, a click event fired on a button
   * activated via keyboard).
   */
  id: number
  /** x coord in physical pixels from top-left; readonly. */
  x: number
  /** y coord in physical pixels from top-left; readonly. */
  y: number
  /** contact width in physical pixels. */
  w: number
  /** contact height in physical pixels. */
  h: number
  /** normalized pressure in [0, 1]. */
  pressure: number
  /** pen x-axis tilt from the screen plane in [-90°, 90°]. */
  tiltX: number
  /** pen y-axis tilt from the screen plane in [-90°, 90°]. */
  tiltY: number
  /** pen rotation around its axis in degrees [0°, 359°]. */
  twist: number
  device: PointerDevice
  /** true if this is the primary pointer. */
  primary: boolean
  /**
   * bitmask of buttons pressed: 1 primary (left); 2 secondary (right);
   * 4 auxiliary (middle), 8 back, 16 forward.
   */
  buttons: number
}

export class Pointer {
  /** readonly. */
  polls: {[pointerID: number]: PointerPoll} = {}
  onEvent: OnEvent = () => {}
  readonly #target: Element

  constructor(target: Element) {
    this.#target = target
  }

  register(op: 'add' | 'remove'): void {
    for (const ev of [
      'pointercancel',
      'pointerdown',
      'pointermove',
      'pointerup'
    ])
      this.#target[`${op}EventListener`](ev, this.#onPointer as EventListener)
  }

  reset(): void {
    this.polls = {}
  }

  #onPointer = (ev: PointerEvent): void => {
    if (ev.type === 'pointercancel' || ev.type === 'pointerup')
      delete this.polls[ev.pointerId]
    else {
      if (ev.type === 'pointerdown')
        this.#target.setPointerCapture(ev.pointerId)
      this.polls[ev.pointerId] = {
        id: ev.pointerId,
        x: ev.clientX * devicePixelRatio,
        y: ev.clientY * devicePixelRatio,
        w: ev.width * devicePixelRatio,
        h: ev.height * devicePixelRatio,
        pressure: ev.pressure,
        tiltX: ev.tiltX,
        tiltY: ev.tiltY,
        twist: ev.twist,
        device: pointerDevice[ev.pointerType] ?? PointerDevice.Unknown,
        primary: ev.isPrimary,
        buttons: ev.buttons
      }
    }
    this.onEvent(`input-${ev.type}` as AnyEvent)
  }
}
