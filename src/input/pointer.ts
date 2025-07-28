import {
  type Box,
  type XY,
  xyAdd,
  xyDistance,
  xyEq,
  xyMax,
  xyMin,
  xySub
} from '../types/geo.ts'

export type PointType =
  (typeof pointTypeByPointerType)[keyof typeof pointTypeByPointerType]

type PointEvent = {
  bits: number
  /** most recent click. */
  clickClient: XY
  drag: boolean
  ev: (typeof pointEvents)[number]
  id: number
  /**
   * cursors should only use the primary inputs to avoid flickering between
   * distant points. inputs may be only secondaries.
   */
  primary: boolean
  type: PointType | undefined
  xyClient: XY
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
  dragMinClient: number = 5
  invalid: boolean = false
  /** primary may be on or off. */
  primary: Readonly<PointEvent> | undefined
  /**
   * secondaries are deleted when buttons are off. secondaries are only present
   * when primary is defined.
   */
  readonly secondary: {[id: number]: Readonly<PointEvent>} = {}
  /** nonnegative. */
  #pinchStartClient: XY = {x: 0, y: 0}
  readonly #target: Element

  constructor(target: Element) {
    this.#target = target
  }

  get boundsClient(): Box | undefined {
    if (!this.primary?.bits && !Object.keys(this.secondary).length) return
    let min = {x: Infinity, y: Infinity}
    let max = {x: -Infinity, y: -Infinity}
    for (const pt of [this.primary, ...Object.values(this.secondary)]) {
      if (!pt?.bits) continue
      min = xyMin(min, pt.xyClient)
      max = xyMax(max, pt.xyClient)
    }
    return {x: min.x, y: min.y, w: max.x - min.x, h: max.y - min.y}
  }

  get centerClient(): XY | undefined {
    const bounds = this.boundsClient
    if (!bounds) return this.primary?.xyClient
    return xyAdd(bounds, {x: bounds.w / 2, y: bounds.h / 2})
  }

  get pinchClient(): XY {
    return xySub(this.#newPinchClient, this.#pinchStartClient)
  }

  postupdate(): void {
    this.invalid = false
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    for (const ev of pointEvents) fn(ev, this.#onInput as EventListener) //, {passive: true}) am I just paying this anyway on touch start?
    return this
  }

  reset(): void {
    this.primary = undefined
    for (const pt in this.secondary) delete this.secondary[pt]
    this.#pinchStartClient = {x: 0, y: 0}
  }

  update(): void {
    const on =
      (this.primary?.bits ? 1 : 0) + Object.values(this.secondary).length
    if (on < 2 || xyEq(this.#pinchStartClient, {x: 0, y: 0}))
      this.#pinchStartClient = this.#newPinchClient
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
    if (!ev.isTrusted) return
    this.invalid = true
    ev.preventDefault()
    if (ev.type === 'pointerdown') this.#target.setPointerCapture(ev.pointerId)

    const prevPt = ev.isPrimary ? this.primary : this.secondary[ev.pointerId]
    const bits = this.#evButtonsToBits(ev.buttons)
    const xyClient = {x: ev.offsetX, y: ev.offsetY}
    const evType = ev.type as (typeof pointEvents)[number]
    const type =
      pointTypeByPointerType[
        ev.pointerType as keyof typeof pointTypeByPointerType
      ]
    const clickClient =
      evType === 'pointerdown' || !prevPt
        ? {x: xyClient.x, y: xyClient.y}
        : {x: prevPt.clickClient.x, y: prevPt.clickClient.y}
    const drag =
      !!bits &&
      (prevPt?.drag || xyDistance(clickClient, xyClient) >= this.dragMinClient)

    const pt = {
      clickClient,
      bits,
      drag,
      ev: evType,
      id: ev.pointerId,
      primary: ev.isPrimary,
      type,
      xyClient
    }
    if (ev.isPrimary) this.primary = pt
    else if (!bits) delete this.secondary[ev.pointerId]
    else this.secondary[ev.pointerId] = pt
  }

  get #newPinchClient(): XY {
    if ((this.primary?.bits ? 1 : 0) + Object.values(this.secondary).length < 2)
      return {x: 0, y: 0}
    const bounds = this.boundsClient
    return bounds ? {x: bounds.w, y: bounds.h} : {x: 0, y: 0}
  }
}
