import type { Cam } from '../cam.ts'
import { type XY, xyAddTo, xyDiv } from '../types/2d.ts'

export type PointType =
  (typeof pointTypeByPointerType)[keyof typeof pointTypeByPointerType]

type PointEvent = {
  /** Aggregate on buttons. */
  bits: number,
  /**
   * Position relative canvas top-left in level scale (like level xy but no cam
   * offset) within cam at capture time.
   */
  canvasXY: XY,
  /** Event position relative canvas top-left (in DPI scale). */
  clientXY: XY,
  ev: typeof pointEvents[number],
  /** Frame number event was recorded. */
  frameNum: number,
  id: number,
  // key: {alt: boolean, ctrl: boolean, meta: boolean, shift: boolean}
  // clicks (detail)
  /**
   * Cursors should only use the primary inputs to avoid flickering between
   * distant points. Inputs may all be secondaries.
   */
  primary: boolean,
  type: PointType | undefined,
  /** Level position within cam at capture time. */
  xy: XY
}

const pointTypeByPointerType = {
  mouse: 'Mouse',
  pen: 'Pen',
  touch: 'Touch'
} as const
const pointEvents = [
  'pointercancel',
  'pointerdown',
  'pointermove',
  'pointerup'
] as const

export class Pointer {
  readonly bitByButton: {[btn: number]: number} = {}
  primary: Readonly<PointEvent> | undefined
  readonly #cam: Readonly<Cam>
  #frameNum: number = 0
  readonly secondary: Readonly<PointEvent>[] = []
  readonly #target: EventTarget

  constructor(cam: Readonly<Cam>, target: EventTarget) {
    this.#cam = cam
    this.#target = target
  }

  get center(): {canvasXY: XY, clientXY: XY, xy: XY} | undefined {
    const sum = {
      canvasXY: {x: 0, y: 0},
      clientXY: {x: 0, y: 0},
      xy: {x: 0, y: 0}
    }
    let pts = 0
    for (const pt of [this.primary, ...this.secondary]) {
      if (!pt?.bits) continue
      pts++
      xyAddTo(sum.canvasXY, pt.canvasXY)
      xyAddTo(sum.clientXY, pt.clientXY)
      xyAddTo(sum.xy, pt.xy)
    }
    if (!pts) return
    return {
      canvasXY: xyDiv(sum.canvasXY, {x: pts, y: pts}),
      clientXY: xyDiv(sum.clientXY, {x: pts, y: pts}),
      xy: xyDiv(sum.xy, {x: pts, y: pts})
    }
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    for (const ev of pointEvents)
      fn(ev, this.#onInput as EventListener, {capture: true, passive: true})
    return this
  }

  reset(): void {
    this.primary = undefined
    this.secondary.length = 0
    this.#frameNum = 0
  }

  update(frameNum: number): void {
    this.#frameNum = frameNum
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #evButtonsToBits(btns: number): number {
    let bits = 0
    for (let btn = 1; btn <= btns; btn <<= 1)
      if ((btn & btns) === btn) bits |= this.bitByButton[btn] ?? 0
    return bits
  }

  #onInput = (ev: PointerEvent): void => {
    if (!ev.isTrusted && !globalThis.Deno) return
    if (!globalThis.Deno && this.#target instanceof Element)
      this.#target.setPointerCapture(ev.pointerId)
    const clientXY = {x: ev.offsetX, y: ev.offsetY}
    const canvasXY = this.#cam.toCanvasXY(clientXY)
    const xy = this.#cam.toXY(clientXY)
    const bits = this.#evButtonsToBits(ev.buttons)
    const evType = ev.type as typeof pointEvents[number]
    const type = pointTypeByPointerType[
      ev.pointerType as keyof typeof pointTypeByPointerType
    ]

    const pt = {
      bits,
      canvasXY,
      clientXY,
      ev: evType,
      frameNum: this.#frameNum,
      id: ev.pointerId,
      primary: ev.isPrimary,
      type,
      xy
    }
    if (ev.isPrimary) this.primary = pt
    else this.secondary.push(pt)
  }
}
