import { I16XY, NumXY, Uint } from '@/ooz'
import { Button, Cam, pointerMap, PointerType, Viewport } from '@/void'

export interface PointerEventPub extends
  Pick<
    HTMLCanvasElement,
    'addEventListener' | 'removeEventListener' | 'requestPointerLock'
  > {
  requestPointerLock(options?: { unadjustedMovement: true }): void
}
export interface PointerLock
  extends Pick<DocumentOrShadowRoot, 'pointerLockElement'> {}

export class PointerPoller {
  /** The button state of the most recent pointer. */
  #buttons: Uint
  #cam: Readonly<Cam>
  /** The raw position of the most recenter pointer. */
  readonly #clientXY: NumXY = new NumXY(0, 0)
  readonly #pub: PointerEventPub
  readonly #lock: PointerLock
  /** The pointer type of the most recent pointer. Undefined when canceled. */
  #pointerType?: PointerType | undefined
  /** The level position of the most recent pointer. Undefined when canceled. */
  #xy?: I16XY | undefined

  constructor(cam: Readonly<Cam>, lock: PointerLock, pub: PointerEventPub) {
    this.#buttons = Uint(0)
    this.#cam = cam
    this.#lock = lock
    this.#pub = pub
  }

  get pointerType(): PointerType | undefined {
    return this.#pointerType
  }

  postupdate(): void {
    // pointerdown, pointermove, and pointerup events are all treated as
    // pointing but there's no event to clear the pointing state. If there's no
    // other button on, consider pointing off.
    if (this.#buttons === 0 || this.#buttons === Button.Bit.Point) this.reset()
  }

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const
    this.#pub[fn]('pointercancel', this.reset, { capture: true, passive: true })
    for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
      this.#pub[fn](
        type,
        this.#onPointEvent as EventListenerOrEventListenerObject,
        { capture: true, passive: type !== 'pointerdown' },
      )
    }
    this.#pub[fn]('contextmenu', this.#onContextMenuEvent, { capture: true })
  }

  reset = (): void => {
    this.#buttons = Uint(0)
    this.#pointerType = undefined
    this.#xy = undefined
  }

  get sample(): Uint {
    return this.#buttons
  }

  get xy(): I16XY | undefined {
    return this.#xy
  }

  #locked(): boolean {
    return this.#lock.pointerLockElement === this.#pub
  }

  #onContextMenuEvent = (ev: Event): void => ev.preventDefault()

  #onPointEvent = (ev: PointerEvent): void => {
    if (ev.type === 'pointerdown' && !this.#locked()) {
      // Disable adjusted movement--this breaks my Wacom pen.
      this.#pub.requestPointerLock({ unadjustedMovement: true })
    }

    // Pointer poller represents one device so only singular point events are
    // supported. If multiple were allowed, an input on one side of the screen
    // may be immediately followed by an input on the other causing a
    // significant hop. When dragging, for example, this can cause the dragged
    // item to flicker between the two points.
    if (!ev.isPrimary) return

    if (this.#locked()) this.#clientXY.addClamp(ev.movementX, ev.movementY)
    else this.#clientXY.setClamp(ev.clientX, ev.clientY)

    this.#buttons = pointerButtonsToButton(ev.buttons)
    this.#pointerType = PointerType.parse(ev.pointerType)
    this.#xy = Viewport.toLevelXY(
      this.#clientXY,
      this.#cam.clientViewportWH,
      this.#cam.viewport,
    )

    const passive = ev.type !== 'pointerdown'
    if (!passive) ev.preventDefault()
  }
}

function pointerButtonsToButton(buttons: number): Uint {
  let mapped: Uint = Button.Bit.Point // All events are points.
  // to-do: use Uint-safe left-shift-assign.
  for (let button = 1; button <= buttons; button <<= 1) {
    if ((button & buttons) !== button) continue
    const fn = pointerMap[button]
    if (fn == null) continue
    mapped = Uint(mapped | Button.Bit[fn]) // to-do: use Uint-safe or-assign.
  }
  return mapped
}
