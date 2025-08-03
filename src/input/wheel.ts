import type {XYZ} from '../types/geo.ts'

export class Wheel {
  deltaClient: Readonly<XYZ> | undefined
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  postupdate(): void {
    this.deltaClient = undefined
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('wheel', this.#onInput as EventListener)
    return this
  }

  reset(): void {
    this.deltaClient = undefined
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onInput = (ev: WheelEvent): void => {
    if (!ev.isTrusted) return
    this.deltaClient = {x: ev.deltaX, y: ev.deltaY, z: ev.deltaZ}
    ev.preventDefault() // disable scaling.
  }
}
