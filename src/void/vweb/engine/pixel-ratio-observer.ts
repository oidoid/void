/**
 * observes density changes that may not trigger a resize such as ctrl+scroll.
 */
export class PixelRatioObserver {
  onChange: () => void = () => {}
  #query: MediaQueryList | undefined

  register(op: 'add' | 'remove'): this {
    this.#query?.removeEventListener('change', this.#onChange)

    if (op === 'add') {
      this.#query = matchMedia(`not (resolution: ${devicePixelRatio}dppx)`)
      this.#query.addEventListener('change', this.#onChange)
    } else this.#query = undefined

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
