type XYZ = {x: number, y: number, z: number}

export class Wheel {
  clientDelta: Readonly<XYZ> | undefined
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('wheel', this.#onInput as EventListener, {capture: true, passive: false})
    return this
  }

  reset(): void {
    this.clientDelta = undefined
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onInput = (ev: WheelEvent): void => {
    if (!ev.isTrusted && !globalThis.Deno) return
    this.clientDelta = {x: ev.deltaX, y: ev.deltaY, z: ev.deltaZ}
    ev.preventDefault() // disable scaling.
  }
}
