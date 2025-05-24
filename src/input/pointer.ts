import { type XY, xyAddTo, xyDistance, xyDiv } from '../types/geo.ts'

export type PointType =
  (typeof pointTypeByPointerType)[keyof typeof pointTypeByPointerType]

type PointEvent = {
  bits: number,
  /** position when any other pointer was first detected otherwise most recent click. */
  clientAnchor: XY,
  /** most recent pointer down. */
  // clientClick: XY | undefined,
  clientXY: XY,
  // i either can't update end / start in the event handler or i have to update in update()
  drag: boolean,
  dragEnd: boolean,
  dragStart: boolean,
  ev: typeof pointEvents[number],
  id: number,
  // key: {alt: boolean, ctrl: boolean, meta: boolean, shift: boolean}
  /**
   * cursors should only use the primary inputs to avoid flickering between
   * distant points. inputs may be only secondaries.
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
    if (!globalThis.Deno && !ev.isTrusted) return
    ev.preventDefault()
    if (!globalThis.Deno && this.#target instanceof Element)
      this.#target.setPointerCapture(ev.pointerId)

    const clientXY = {x: ev.offsetX, y: ev.offsetY}
    const bits = this.#evButtonsToBits(ev.buttons)
    const evType = ev.type as typeof pointEvents[number]
    const type = pointTypeByPointerType[
      ev.pointerType as keyof typeof pointTypeByPointerType
    ]
    const lastPt = ev.isPrimary
      ? this.primary
      : this.secondary.find((secondary) => ev.pointerId === secondary.id)
    // const clientClick = evType === 'pointerdown'
    //   ? {x: clientXY.x, y: clientXY.y}
    //   : lastPt?.clientClick
    const clientDragMin = 5
    const anchor = evType === 'pointerdown'
      || ((this.primary && !ev.isPrimary ? 1 : 0)
          + this.secondary.filter((point) => point.id !== ev.pointerId).length)
        === 1

    const clientAnchor = anchor || !lastPt
      ? {x: clientXY.x, y: clientXY.y}
      : lastPt.clientAnchor
    // ?? (clientClick ? {x: clientClick.x, y: clientClick.y} : undefined)
    const pt = {
      bits,
      clientAnchor,
      // clientClick,
      clientXY,
      drag: false,
      dragStart: false,
      dragEnd: false,
      ev: evType,
      id: ev.pointerId,
      primary: ev.isPrimary,
      type
    }
    const canceled = ev.type === 'pointercancel'
    if (ev.isPrimary) this.primary = canceled ? undefined : pt
    else if (canceled || evType === 'pointerup') {
      const i = this.secondary.findIndex((pt) => pt.id === ev.pointerId)
      if (i !== -1) this.secondary.splice(i, 1)
    }
    else { this.secondary.push(pt) }

    const points = this.primary
      ? [this.primary, ...this.secondary]
      : this.secondary
    const pinch = points.length
      ? points.reduce(
        (sum, pt) => sum + xyDistance(pt.clientAnchor, pt.clientXY),
        0
      ) / points.length
      : 0

    // multiStart is when two or more fingers are down. pinch distance is sum(current - multiStart, fingers) / #fingers? pivot point is clientCenter
    pt.drag = evType === 'pointermove' && !!bits && !!pinch && (
      lastPt?.drag
      // || !!clientClick
      || xyDistance(clientAnchor, clientXY) >= clientDragMin
    )
    pt.dragStart = !lastPt?.drag && pt.drag
    pt.dragEnd = !!lastPt?.drag && !pt.drag
  }
}
