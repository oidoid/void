export class ContextMenu {
  enableMenu: boolean = false
  readonly #target: EventTarget

  constructor(target: EventTarget) {
    this.#target = target
  }

  register(op: 'add' | 'remove'): this {
    const fn = this.#target[`${op}EventListener`].bind(this.#target)
    fn('contextmenu', this.#onContextMenu, {capture: true})
    // disable long press vibration. nonpassive must be explicit for touchstart.
    fn('touchstart', this.#onContextMenu, {capture: true, passive: false})
    return this
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onContextMenu = (ev: Event): void => {
    if (!ev.isTrusted && !globalThis.Deno) return
    if (!this.enableMenu) ev.preventDefault()
  }
}
