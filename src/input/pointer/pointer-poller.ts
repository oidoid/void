import { XY } from '@/ooz'
import {
  ButtonBit,
  Cam,
  parsePointerType,
  pointerMap,
  PointerType,
  viewportToLevelXY,
} from '@/void'

export interface PointerEventPub extends
  Pick<
    HTMLCanvasElement,
    'addEventListener' | 'removeEventListener' | 'requestPointerLock'
  > {
  requestPointerLock(
    options?: { unadjustedMovement: true },
  ): Promise<void> | void
}
export interface PointerLock
  extends Pick<Document, 'exitPointerLock' | 'pointerLockElement'> {}

export class PointerPoller {
  /** The button state of the most recent pointer. */
  #buttons: number
  #cam: Readonly<Cam>
  /** The raw position of the most recenter pointer. */
  readonly #clientXY: XY = new XY(0, 0)
  readonly #pub: PointerEventPub
  readonly #lock: PointerLock
  /** The pointer type of the most recent pointer. Undefined when canceled. */
  #pointerType?: PointerType | undefined
  #xy?: XY | undefined

  constructor(cam: Readonly<Cam>, lock: PointerLock, pub: PointerEventPub) {
    this.#buttons = 0
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
    if (this.#buttons === 0 || this.#buttons === ButtonBit.Point) this.reset()
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
    this.#buttons = 0
    this.#pointerType = undefined
    this.#xy = undefined
  }

  get sample(): number {
    return this.#buttons
  }

  /**
   * The integral level position of the most recent pointer. Undefined when
   * canceled.
   */
  get xy(): XY | undefined {
    return this.#xy
  }

  get #locked(): boolean {
    return this.#lock.pointerLockElement === this.#pub
  }

  #onContextMenuEvent = (ev: Event): void => ev.preventDefault()

  #onPointEvent = (ev: PointerEvent): void => {
    if (
      ev.pointerType === 'mouse' && ev.type === 'pointerdown' && !this.#locked
    ) this.#pub.requestPointerLock()
    else if (ev.pointerType !== 'mouse' && this.#locked) {
      // PointerLock is squirrely on my tablet. Unlock if not a mouse.
      this.#lock.exitPointerLock()
    }

    // Pointer poller represents one device so only singular point events are
    // supported. If multiple were allowed, an input on one side of the screen
    // may be immediately followed by an input on the other causing a
    // significant hop. When dragging, for example, this can cause the dragged
    // item to flicker between the two points.
    if (!ev.isPrimary) return

    if (this.#locked) {
      this.#clientXY.add(ev.movementX, ev.movementY).max(0, 0)
        .min(window.innerWidth, window.innerHeight) // to-do: pass in window.
    } else this.#clientXY.set(ev.clientX, ev.clientY)

    this.#buttons = pointerButtonsToButton(ev.buttons)
    this.#pointerType = parsePointerType(ev.pointerType)
    this.#xy = viewportToLevelXY(
      this.#clientXY,
      this.#cam.clientViewportWH,
      this.#cam.viewport,
    )

    const passive = ev.type !== 'pointerdown'
    if (!passive) ev.preventDefault()
  }
}

function pointerButtonsToButton(buttons: number): number {
  let mapped: number = ButtonBit.Point // All events are points.
  for (let button = 1; button <= buttons; button <<= 1) {
    if ((button & buttons) !== button) continue
    const fn = pointerMap[button]
    if (fn == null) continue
    mapped = mapped | ButtonBit[fn]
  }
  return mapped
}
