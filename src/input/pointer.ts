import { type XY, xyAddTo, xyDistance, xyDiv } from '../types/geo.ts'

export type PointType =
  (typeof pointTypeByPointerType)[keyof typeof pointTypeByPointerType]

type PointEvent = {
  bits: number,
  /**
   * position when any other pointer was first detected otherwise most recent
   * click.
   */
  anchorClient: XY,
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
  primary: Readonly<PointEvent> | undefined
  readonly secondary: Readonly<PointEvent>[] = []
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  get centerClient(): XY | undefined {
    if (!this.primary?.bits && !this.secondary.length) return
    const sum = {x: 0, y: 0}
    let pts = 0
    for (const pt of [this.primary, ...this.secondary]) {
      if (!pt?.bits) continue
      pts++
      xyAddTo(sum, pt.xyClient)
    }
    return pts ? xyDiv(sum, {x: pts, y: pts}) : undefined
  }

  get pinchClient(): number {
    let distance = 0
    let pts = 0
    for (const pt of [this.primary, ...this.secondary]) {
      if (!pt?.bits) continue
      pts++
      distance += xyDistance(pt.anchorClient, pt.xyClient)
    }
    return pts >= 2 ? distance / pts : 0
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

    const prevPt = ev.isPrimary
      ? this.primary
      : this.secondary.find((pt) => ev.pointerId === pt.id)

    const bits = this.#evButtonsToBits(ev.buttons)
    const xyClient = {x: ev.offsetX, y: ev.offsetY}
    const evType = ev.type as typeof pointEvents[number]
    const type = pointTypeByPointerType[
      ev.pointerType as keyof typeof pointTypeByPointerType
    ]

    const anchor = ((this.primary && !ev.isPrimary ? 1 : 0)
      + this.secondary.filter((pt) => pt.id !== ev.pointerId).length)
      === 1
    const anchorClient = evType === 'pointerdown' || anchor || !prevPt
      ? {x: xyClient.x, y: xyClient.y}
      : {x: prevPt.anchorClient.x, y: prevPt.anchorClient.y}

    const drag = !!bits && (
      prevPt?.drag
      || xyDistance(anchorClient, xyClient) >= this.dragMinClient
    )

    const pt = {
      anchorClient,
      bits,
      drag,
      ev: evType,
      id: ev.pointerId,
      primary: ev.isPrimary,
      type,
      xyClient
    }
    if (ev.isPrimary) this.primary = pt
    else if (ev.type === 'pointercancel' || evType === 'pointerup') {
      const i = this.secondary.findIndex((pt) => pt.id === ev.pointerId)
      if (i !== -1) this.secondary.splice(i, 1)
    }
    else { this.secondary.push(pt) }
  }
}
