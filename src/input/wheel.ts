import type { Cam } from '../cam.ts'
import type { XY } from '../types/2d.ts'

type XYZ = {x: number, y: number, z: number}

export class Wheel {
  canvasDelta: Readonly<XY> | undefined
  clientDelta: Readonly<XYZ> | undefined
  delta: Readonly<XY> | undefined
  readonly #cam: Readonly<Cam>
  readonly #target: EventTarget

  constructor(cam: Readonly<Cam>, target: EventTarget) {
    this.#cam = cam
    this.#target = target
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('wheel', this.#onInput as EventListener, {capture: true, passive: false})
    return this
  }

  reset(): void {
    this.canvasDelta = undefined
    this.clientDelta = undefined
    this.delta = undefined
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onInput = (ev: WheelEvent): void => {
    if (!ev.isTrusted && !globalThis.Deno) return
    this.clientDelta = {x: ev.deltaX, y: ev.deltaY, z: ev.deltaZ}
    this.canvasDelta = this.#cam.toCanvasXY(this.clientDelta)
    this.delta = this.#cam.toXY(this.clientDelta)
    ev.preventDefault() // disable scaling.
  }
}
