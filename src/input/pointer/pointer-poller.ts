import { I16XY, NumXY, Uint } from '@/ooz'
import { Button, Cam, pointerMap, PointerType, Viewport } from '@/void'

export class PointerPoller {
  /** The button state of the most recent pointer. */
  #buttons: Uint
  #cam: Readonly<Cam>
  /** The pointer type of the most recent pointer. Undefined when canceled. */
  #pointerType?: PointerType | undefined
  /** The level position of the most recent pointer. Undefined when canceled. */
  #xy?: I16XY | undefined

  get pointerType(): PointerType | undefined {
    return this.#pointerType
  }

  get sample(): Uint {
    return this.#buttons
  }

  get xy(): I16XY | undefined {
    return this.#xy
  }

  constructor(cam: Readonly<Cam>) {
    this.#buttons = Uint(0)
    this.#cam = cam
  }

  postupdate(): void {
    // pointerdown, pointermove, and pointerup events are all treated as
    // pointing but there's no event to clear the pointing state. If there's no
    // other button on, consider pointing off.
    if (this.#buttons == 0 || this.#buttons == Button.Bit.Point) this.reset()
  }

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const
    window[fn]('pointercancel', this.reset, { capture: true, passive: true })
    for (const type of ['pointerdown', 'pointermove', 'pointerup'] as const) {
      window[fn](
        type,
        this.#onPointEvent as EventListenerOrEventListenerObject,
        { capture: true, passive: type != 'pointerdown' },
      )
    }
    window[fn]('contextmenu', this.#onContextMenuEvent, { capture: true })
  }

  reset = (): void => {
    this.#buttons = Uint(0)
    this.#pointerType = undefined
    this.#xy = undefined
  }

  #onContextMenuEvent = (ev: Event): void => ev.preventDefault()

  #onPointEvent = (ev: PointerEvent): void => {
    // Pointer poller represents one device so only singular point events are
    // supported. If multiple were allowed, an input on one side of the screen
    // may be immediately followed by an input on the other causing a
    // significant hop. When dragging, for example, this can cause the dragged
    // item to flicker between the two points.
    if (!ev.isPrimary) return

    this.#buttons = pointerButtonsToButton(ev.buttons)
    this.#pointerType = PointerType.parse(ev.pointerType)
    const clientXY = new NumXY(ev.clientX, ev.clientY)
    this.#xy = Viewport.toLevelXY(
      clientXY,
      this.#cam.clientViewportWH,
      this.#cam.viewport,
    )

    const passive = ev.type != 'pointerdown'
    if (!passive) ev.preventDefault()
  }
}

function pointerButtonsToButton(buttons: number): Uint {
  let mapped: Uint = Button.Bit.Point // All events are points.
  // to-do: use Uint-safe left-shift-assign.
  for (let button = 1; button <= buttons; button <<= 1) {
    if ((button & buttons) != button) continue
    const fn = pointerMap[button]
    if (fn == null) continue
    mapped = Uint(mapped | Button.Bit[fn]) // to-do: use Uint-safe or-assign.
  }
  return mapped
}
