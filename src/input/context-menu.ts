export class ContextMenu {
  enable: boolean = false
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('contextmenu', this.#onContextMenu)
    // disable long press vibration. nonpassive must be explicit for touchstart.
    fn('touchstart', this.#onContextMenu, {passive: false}) // to-do: do I need this if my pointer is doing prevent default?
    return this
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onContextMenu = (ev: Event): void => {
    if (!ev.isTrusted && !globalThis.Deno) return
    if (!this.enable) ev.preventDefault()
  }
}
