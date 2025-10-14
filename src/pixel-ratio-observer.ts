/**
 * when moving the window across monitors, resolution changes may not trigger a
 * resize. observe density changes.
 */
export class PixelRatioObserver {
  onChange: () => void = () => {}
  #mediaQuery: MediaQueryList | undefined

  register(op: 'add' | 'remove'): this {
    this.#mediaQuery?.removeEventListener('change', this.#onChange)

    if (op === 'add') {
      this.#mediaQuery = matchMedia(`not (resolution: ${devicePixelRatio}dppx)`)
      this.#mediaQuery.addEventListener('change', this.#onChange)
    } else this.#mediaQuery = undefined

    return this
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  #onChange = (): void => {
    this.register('add')
    this.onChange()
  }
}
