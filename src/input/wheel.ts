import type {XYZ} from '../types/geo.ts'

/** @internal */
export class Wheel {
  deltaClient: Readonly<XYZ> | undefined
  onEvent: () => void = () => {}
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  postupdate(): void {
    this.deltaClient = undefined
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('wheel', this.#onInput as EventListener, {passive: true})
    return this
  }

  reset(): void {
    this.deltaClient = undefined
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onInput = (ev: WheelEvent): void => {
    if (!ev.isTrusted || ev.metaKey || ev.altKey || ev.ctrlKey) return
    this.deltaClient = {x: ev.deltaX, y: ev.deltaY, z: ev.deltaZ}
    this.onEvent()
  }
}
