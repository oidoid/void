import { I16XY, NumXY } from '@/oidlib'
import { Button, Cam, pointerMap, PointerType, Viewport } from '@/void'

export class PointerPoller {
  /** The button state of the most recent pointer. */
  #buttons: bigint
  #cam: Readonly<Cam>
  /** The pointer type of the most recent pointer. Undefined when canceled. */
  #pointerType?: PointerType | undefined
  /** The level position of the most recent pointer. Undefined when canceled. */
  #xy?: I16XY | undefined

  get pointerType(): PointerType | undefined {
    return this.#pointerType
  }

  get sample(): bigint {
    return this.#buttons
  }

  get xy(): I16XY | undefined {
    return this.#xy
  }

  constructor(cam: Cam) {
    this.#buttons = 0n
    this.#cam = cam
  }

  postupdate(): void {
    // pointerdown, pointermove, and pointerup events are all treated as
    // pointing but there's no event to clear the pointing state. If there's no
    // other button on, consider pointing off.
    if (this.#buttons == 0n || this.#buttons == Button.Bit.Point) this.reset()
  }

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const
    window[fn]('pointercancel', this.reset, { capture: true, passive: true })
    const types = ['contextmenu', 'pointerdown', 'pointermove', 'pointerup']
    for (const type of types) {
      const passive = type != 'contextmenu' && type != 'pointerdown'
      window[fn](type, this.#onPointEvent, { capture: true, passive })
    }
  }

  reset = (): void => {
    this.#buttons = 0n
    this.#pointerType = undefined
    this.#xy = undefined
  }

  #onPointEvent = (ev: PointerEvent | Event): void => {
    if (ev.type != 'contextmenu') {
      const pointer = <PointerEvent> ev
      this.#buttons = pointerButtonsToButton(pointer.buttons)
      this.#pointerType = PointerType.parse(pointer.pointerType)
      const clientXY = new NumXY(pointer.clientX, pointer.clientY)
      this.#xy = Viewport.toLevelXY(
        clientXY,
        this.#cam.clientViewportWH,
        this.#cam.viewport,
      )
    }

    const active = ev.type == 'contextmenu' || ev.type == 'pointerdown'
    if (active) ev.preventDefault()
  }
}

function pointerButtonsToButton(buttons: number): bigint {
  let mapped: bigint = Button.Bit.Point // All events are points.
  for (let button = 1; button <= buttons; button <<= 1) {
    if ((button & buttons) != button) continue
    const fn = pointerMap[button]
    if (fn == null) continue
    mapped |= Button.Bit[fn]
  }
  return mapped
}
