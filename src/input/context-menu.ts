/** @internal */
export class ContextMenu {
  enable: boolean = false
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('contextmenu', this.#onContextMenu as EventListener)
    // disable long press vibration. nonpassive must be explicit.
    fn('touchstart', this.#onContextMenu as EventListener, {passive: false})
    return this
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onContextMenu = (ev: PointerEvent | TouchEvent): void => {
    if (!ev.isTrusted || ev.metaKey) return
    if (!this.enable) ev.preventDefault()
  }
}
