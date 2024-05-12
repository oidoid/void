import {Cam} from '../renderer/cam.js'
import type {XY} from '../types/2d.js'

export class PointerPoller {
  bits: number = 0
  readonly #cam: Readonly<Cam>
  readonly #canvas: HTMLCanvasElement
  readonly #clientXY: XY = {x: 0, y: 0}
  type?: 'mouse' | 'touch' | 'pen' | undefined
  xy?: Readonly<XY> | undefined

  constructor(cam: Readonly<Cam>, canvas: HTMLCanvasElement) {
    this.#cam = cam
    this.#canvas = canvas
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
    this.bits = 0
    this.type = undefined
    this.xy = undefined
  }

  #onContextMenuEvent = (ev: Event): void => ev.preventDefault()

  #onPointEvent = (ev: PointerEvent): void => {
    // Ignore non-primary inputs to avoid flickering between distant points.
    if (!ev.isPrimary) return

    if (ev.type === 'pointerdown') this.#canvas.setPointerCapture(ev.pointerId)

    if (ev.type === 'pointerdown') this.bits |= ev.buttons
    else if (ev.type === 'pointerup') this.bits &= ~ev.buttons
    this.type = (<const>['mouse', 'touch', 'pen']).find(
      type => type === ev.pointerType
    )
    this.xy = this.#cam.toLevelXY(this.#clientXY)
    ;({clientX: this.#clientXY.x, clientY: this.#clientXY.y} = ev)

    if (ev.type === 'pointerdown') ev.preventDefault() // not passive.
  }
}
