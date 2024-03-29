import {Cam} from '../graphics/cam.js'
import type {XY} from '../types/2d.js'

export class PointerPoller {
  readonly #bitByButton: {[btn: number]: number} = {}
  #bits: number = 0
  readonly #cam: Readonly<Cam>
  readonly #canvas: HTMLCanvasElement
  readonly #clientXY: XY = {x: 0, y: 0}
  #type?: 'mouse' | 'touch' | 'pen' | undefined
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

  get type(): 'mouse' | 'touch' | 'pen' | undefined {
    return this.#type
  }

  register(op: 'add' | 'remove'): void {
    const fn = <const>`${op}EventListener`
    this.#canvas[fn]('pointercancel', this.reset, {
      capture: true,
      passive: true
    })
    for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
      this.#canvas[fn](
        type,
        <EventListenerOrEventListenerObject>this.#onPointEvent,
        {capture: true, passive: type !== 'pointerdown'}
      )
    }
    this.#canvas[fn]('contextmenu', this.#onContextMenuEvent, {capture: true})
  }

  reset = (): void => {
    this.#bits = 0
    this.#type = undefined
    this.#xy = undefined
  }

  get xy(): Readonly<XY> | undefined {
    return this.#xy
  }

  #onContextMenuEvent = (ev: Event): void => ev.preventDefault()

  #onPointEvent = (ev: PointerEvent): void => {
    // Ignore non-primary inputs to avoid flickering between distant points.
    if (!ev.isPrimary) return

    if (ev.type === 'pointerdown') this.#canvas.setPointerCapture(ev.pointerId)
    ;({clientX: this.#clientXY.x, clientY: this.#clientXY.y} = ev)

    this.#bits = this.#evButtonsToBits(ev.buttons)
    this.#type = (<const>['mouse', 'touch', 'pen']).find(
      type => type === ev.pointerType
    )
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
