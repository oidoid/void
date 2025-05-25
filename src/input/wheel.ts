import type { XYZ } from '../types/geo.ts'

export class Wheel {
  deltaClient: Readonly<XYZ> = {x: 0, y: 0, z: 0}
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('wheel', this.#onInput as EventListener, {passive: false})
    return this
  }

  reset(): void {
    this.deltaClient = {x: 0, y: 0, z: 0}
  }

  postupdate(): void {
    this.deltaClient = {x: 0, y: 0, z: 0}
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onInput = (ev: WheelEvent): void => {
    if (!globalThis.Deno && !ev.isTrusted) return
    this.deltaClient = {x: ev.deltaX, y: ev.deltaY, z: ev.deltaZ}
    ev.preventDefault() // disable scaling.
  }
}
