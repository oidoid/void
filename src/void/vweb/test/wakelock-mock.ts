export type WakelockSentinelMock = EventTarget & {
  release(): Promise<void>
}

export class WakelockMock {
  focused: boolean = true
  reqs: number = 0
  releases: number = 0
  rejection?: Error
  sentinel?: WakelockSentinelMock
  readonly #document = globalThis.document
  readonly #wakeLock = navigator.wakeLock

  constructor() {
    globalThis.document = {
      visibilityState: 'visible',
      hasFocus: () => this.focused
    } as Document
    ;(navigator as {wakeLock: WakeLock}).wakeLock = {
      request: (): Promise<WakeLockSentinel> => {
        this.reqs++
        if (this.rejection) return Promise.reject(this.rejection)
        const sentinel = Object.assign(new EventTarget(), {
          release: (): Promise<void> => {
            this.releases++
            sentinel.dispatchEvent(new Event('release'))
            return Promise.resolve()
          }
        })
        this.sentinel = sentinel
        return Promise.resolve(sentinel as WakeLockSentinel)
      }
    }
  }

  [Symbol.dispose](): void {
    globalThis.document = this.#document
    ;(navigator as {wakeLock: WakeLock}).wakeLock = this.#wakeLock
  }
}
