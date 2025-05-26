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
  bits: number,
  /** most recent click. */
  clickClient: XY,
  drag: boolean,
  ev: typeof pointEvents[number],
  id: number,
  /**
   * cursors should only use the primary inputs to avoid flickering between
   * distant points. inputs may be only secondaries.
   */
  primary: boolean,
  type: PointType | undefined,
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
  /**
   * when present, primary may be on or off. secondaries are deleted when
   * buttons are off. secondaries are only present when primary is defined.
   */
  readonly point: {
    primary?: Readonly<PointEvent>,
    [id: number]: Readonly<PointEvent>
  } = {}
  /** nonnegative. */
  #pinchStartClient: XY = {x: 0, y: 0}
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  get boundsClient(): Box | undefined {
    if (!this.point.primary?.bits && Object.keys(this.point).length < 2) return
    let min = {x: Infinity, y: Infinity}
    let max = {x: -Infinity, y: -Infinity}
    for (const pt of Object.values(this.point)) {
      if (!pt.bits) continue
      min = xyMin(min, pt.xyClient)
      max = xyMax(max, pt.xyClient)
    }
    return {x: min.x, y: min.y, w: max.x - min.x, h: max.y - min.y}
  }

  get centerClient(): XY | undefined {
    const bounds = this.boundsClient
    if (!bounds) return this.point.primary?.xyClient
    return xyAdd(bounds, {x: bounds.w / 2, y: bounds.h / 2})
  }

  get pinchClient(): XY {
    return xySub(this.#newPinchClient, this.#pinchStartClient)
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    for (const ev of pointEvents) fn(ev, this.#onInput as EventListener)
    return this
  }

  reset(): void {
    for (const pt in this.point) delete this.point[pt]
    this.#pinchStartClient = {x: 0, y: 0}
  }

  update(): void {
    const on = (this.point.primary?.bits ? 1 : 0)
      + Object.values(this.point).length - 1
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
    if (!globalThis.Deno && !ev.isTrusted) return
    ev.preventDefault()
    if (!globalThis.Deno && this.#target instanceof Element)
      this.#target.setPointerCapture(ev.pointerId)

    const prevPt = this.point[ev.isPrimary ? 'primary' : ev.pointerId]
    const bits = this.#evButtonsToBits(ev.buttons)
    const xyClient = {x: ev.offsetX, y: ev.offsetY}
    const evType = ev.type as typeof pointEvents[number]
    const type = pointTypeByPointerType[
      ev.pointerType as keyof typeof pointTypeByPointerType
    ]
    const clickClient = evType === 'pointerdown' || !prevPt
      ? {x: xyClient.x, y: xyClient.y}
      : {x: prevPt.clickClient.x, y: prevPt.clickClient.y}
    const drag = !!bits && (
      prevPt?.drag || xyDistance(clickClient, xyClient) >= this.dragMinClient
    )

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
    if (ev.isPrimary) this.point.primary = pt
    else if (!bits) delete this.point[ev.pointerId]
    else this.point[ev.pointerId] = pt
  }

  get #newPinchClient(): XY {
    if (
      (this.point.primary?.bits ? 1 : 0)
          + (Object.values(this.point).length - 1) < 2
    ) { return {x: 0, y: 0} }
    const bounds = this.boundsClient
    return bounds ? {x: bounds.w, y: bounds.h} : {x: 0, y: 0}
  }
}
