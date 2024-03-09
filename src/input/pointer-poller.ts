import { Cam } from '../graphics/cam.ts'
import { XY } from '../types/2d.ts'

export class PointerPoller {
  readonly #bitByButton: Record<number, number> = {}
  #bits = 0
  readonly #cam: Readonly<Cam>
  readonly #canvas: HTMLCanvasElement
  readonly #clientXY: XY = { x: 0, y: 0 }
  #pointerType?: 'mouse' | 'touch' | 'pen' | undefined
  #xy?: Readonly<XY> | undefined

  constructor(cam: Readonly<Cam>, canvas: HTMLCanvasElement) {
    this.#cam = cam
    this.#canvas = canvas
  }

  get bits(): number {
    return this.#bits
  }

  map(button: number, bit: number): void {
    this.#bitByButton[button] = bit
  }

  get pointerType(): 'mouse' | 'touch' | 'pen' | undefined {
    return this.#pointerType
  }

  register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const
    this.#canvas[fn]('pointercancel', this.reset, {
      capture: true,
      passive: true,
    })
    for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
      this.#canvas[fn](
        type,
        this.#onPointEvent as EventListenerOrEventListenerObject,
        { capture: true, passive: type !== 'pointerdown' },
      )
    }
    this.#canvas[fn]('contextmenu', this.#onContextMenuEvent, { capture: true })
  }

  reset = (): void => {
    this.#bits = 0
    this.#pointerType = undefined
    this.#xy = undefined
  }

  get xy(): Readonly<XY> | undefined {
    return this.#xy
  }

  #onContextMenuEvent = (ev: Event): void => ev.preventDefault()

  #onPointEvent = (ev: PointerEvent): void => {
    // Ignore non-primary inputs to avoid flickering between distant points.
    if (!ev.isPrimary) return

    if (
      ev.type === 'pointerdown' && ev.currentTarget instanceof Element
    ) ev.currentTarget.setPointerCapture(ev.pointerId)
    ;({ clientX: this.#clientXY.x, clientY: this.#clientXY.y } = ev)

    this.#bits = this.#evButtonsToBits(ev.buttons)
    this.#pointerType =
      (['mouse', 'touch', 'pen'] as const).filter((type) =>
        type === ev.pointerType
      )[0]
    this.#xy = this.#cam.toLevelXY(this.#clientXY)

    const passive = ev.type !== 'pointerdown'
    if (!passive) ev.preventDefault()
  }

  #evButtonsToBits(buttons: number): number {
    let bits = 0
    for (let button = 1; button <= buttons; button <<= 1) {
      if ((button & buttons) !== button) continue
      bits |= this.#bitByButton[button] ?? 0
    }
    return bits
  }
}
