export class DevicePixelRatioMock {
  readonly #ratio = globalThis.devicePixelRatio

  set ratio(ratio: number) {
    globalThis.devicePixelRatio = ratio
  }

  [Symbol.dispose](): void {
    globalThis.devicePixelRatio = this.#ratio
  }
}
