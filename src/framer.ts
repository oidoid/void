/**
 * requests frames except when hidden. frames are requested even when idle to
 * poll gamepads.
 */
export class Framer {
  /** only millis for frmae not since last frame.? */
  onFrame: ((millis: number) => void) | undefined
  #frame: number = 0

  register(op: 'add' | 'remove'): this {
    const fn = `${op}EventListener` as const
    document[fn]('visibilitychange', this.#onVisibility)
    if (op === 'add') this.#resume()
    else this.#pause()
    return this
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onFrame = (millis: number): void => {
    this.#resume() // call before in case onFrame() unregisters.
    this.onFrame?.(millis)
  }

  #onVisibility = (ev: Event): void => {
    if (!globalThis.Deno && !ev.isTrusted) return
    // ev.preventDefault()
    if (document.hidden) this.#pause()
    else this.#resume()
  }

  #pause(): void {
    cancelAnimationFrame(this.#frame)
  }

  #resume(): void {
    this.#frame = requestAnimationFrame(this.#onFrame)
  }
}
