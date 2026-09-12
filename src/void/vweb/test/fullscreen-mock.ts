export class FullscreenMock {
  reqs: number = 0
  ptrlocks: number = 0
  exits: number = 0
  orientationLocks: OrientationLockType[] = []
  orientationUnlocks: number = 0
  rejection: Error | undefined
  readonly target: Element
  readonly canvas: Element
  readonly #document = globalThis.document
  readonly #innerWidth = globalThis.innerWidth
  readonly #innerHeight = globalThis.innerHeight
  readonly #screen = globalThis.screen
  readonly #matchMedia = globalThis.matchMedia

  constructor() {
    const document = {
      fullscreenEnabled: true,
      fullscreenElement: null as Element | null,
      pointerLockElement: null as Element | null,
      exitFullscreen: async (): Promise<void> => {
        this.exits++
        document.fullscreenElement = null
      }
    }
    this.target = {
      requestFullscreen: async (): Promise<void> => {
        this.reqs++
        if (this.rejection) throw this.rejection
        document.fullscreenElement = this.target
      }
    } as Element
    this.canvas = {
      requestPointerLock: async (): Promise<void> => {
        this.ptrlocks++
        document.pointerLockElement = this.canvas
      }
    } as Element
    globalThis.document = document as Document
    globalThis.innerWidth = 0
    globalThis.innerHeight = 0
    globalThis.screen = {
      width: 1,
      height: 1,
      orientation: {
        lock: async orientation => void this.orientationLocks.push(orientation),
        unlock: () => {
          this.orientationUnlocks++
        }
      }
    } as Screen
    globalThis.matchMedia = () => ({matches: false}) as MediaQueryList
  }

  [Symbol.dispose](): void {
    globalThis.document = this.#document
    globalThis.innerWidth = this.#innerWidth
    globalThis.innerHeight = this.#innerHeight
    globalThis.screen = this.#screen
    globalThis.matchMedia = this.#matchMedia
  }
}
