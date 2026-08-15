export type WakelockSentinelMock = EventTarget & {
  release(): Promise<void>
}

export class WakelockMock {
  requests: number = 0
  releases: number = 0
  rejection?: Error
  sentinel?: WakelockSentinelMock
  readonly #document = globalThis.document
  readonly #wakeLock = navigator.wakeLock

  constructor() {
    globalThis.document = {visibilityState: 'visible'} as Document
    ;(navigator as {wakeLock: WakeLock}).wakeLock = {
      request: async (): Promise<WakeLockSentinel> => {
        this.requests++
        if (this.rejection) throw this.rejection
        const sentinel = Object.assign(new EventTarget(), {
          release: async (): Promise<void> => {
            this.releases++
          }
        })
        this.sentinel = sentinel
        return sentinel as WakeLockSentinel
      }
    }
  }

  [Symbol.dispose](): void {
    globalThis.document = this.#document
    ;(navigator as {wakeLock: WakeLock}).wakeLock = this.#wakeLock
  }
}
