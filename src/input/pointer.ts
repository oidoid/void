import { type XY, xyAddTo, xyDiv } from '../types/geo.ts'

export type PointType =
  (typeof pointTypeByPointerType)[keyof typeof pointTypeByPointerType]

type PointEvent = {
  bits: number,
  clientXY: XY,
  ev: typeof pointEvents[number],
  id: number,
  // key: {alt: boolean, ctrl: boolean, meta: boolean, shift: boolean}
  /**
   * cursors should only use the primary inputs to avoid flickering between
   * distant points. inputs may all be secondaries.
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
  readonly secondary: Readonly<PointEvent>[] = []
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  /** aggregate on buttons. */
  get bits(): number {
    return (this.primary?.bits ?? 0)
      | this.secondary.reduce((sum, {bits}) => sum | bits, 0)
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
    for (const ev of pointEvents) fn(ev, this.#onInput as EventListener)
    return this
  }

  reset(): void {
    this.primary = undefined
    this.secondary.length = 0
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
    ev.preventDefault()
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
      id: ev.pointerId,
      primary: ev.isPrimary,
      type
    }
    const canceled = ev.type === 'pointercancel'
    if (ev.isPrimary) this.primary = canceled ? undefined : pt
    else if (canceled) {
      const i = this.secondary.findIndex((pt) => pt.id === ev.pointerId)
      if (i !== -1) this.secondary.splice(i, 1)
    }
    else { this.secondary.push(pt) }
  }
}
