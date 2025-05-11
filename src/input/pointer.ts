import { type XY, xyAddTo, xyDiv } from '../types/2d.ts'

export type PointType =
  (typeof pointTypeByPointerType)[keyof typeof pointTypeByPointerType]

type PointEvent = {
  /** Aggregate on buttons. */
  bits: number,
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
  type: PointType | undefined
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
  #frameNum: number = 0
  readonly secondary: Readonly<PointEvent>[] = []
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  get clientCenter(): XY | undefined {
    const sum = {x: 0, y: 0}
    let pts = 0
    for (const pt of [this.primary, ...this.secondary]) {
      if (!pt?.bits) continue
      pts++
      xyAddTo(sum, pt.clientXY)
    }
    return pts ? xyDiv(sum, {x: pts, y: pts}) : undefined
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
    const bits = this.#evButtonsToBits(ev.buttons)
    const evType = ev.type as typeof pointEvents[number]
    const type = pointTypeByPointerType[
      ev.pointerType as keyof typeof pointTypeByPointerType
    ]

    const pt = {
      bits,
      clientXY,
      ev: evType,
      frameNum: this.#frameNum,
      id: ev.pointerId,
      primary: ev.isPrimary,
      type
    }
    if (ev.isPrimary) this.primary = pt
    else this.secondary.push(pt)
  }
}
