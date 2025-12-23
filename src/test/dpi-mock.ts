// to-do: use on other DPI tests.
export class DPIMock {
  readonly #dpi = globalThis.devicePixelRatio

  constructor(dpi: number) {
    globalThis.devicePixelRatio = dpi
  }

  [Symbol.dispose](): void {
    globalThis.devicePixelRatio = this.#dpi
  }
}
