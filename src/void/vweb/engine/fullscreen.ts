import {
  exitFullscreen,
  isFullscreen,
  reqFullscreen
} from '../utils/fullscreen-util.ts'

const orientationLocks: readonly (OrientationLockType | undefined)[] = [
  undefined, // FullscreenReqNone.
  undefined, // FullscreenReqExit.
  undefined, // FullscreenReqEnter: fullscreen without an orientation lock.
  'portrait', // FullscreenReqPortrait.
  'landscape' // FullscreenReqLandscape.
]

export class Fullscreen {
  #changing: boolean = false
  readonly #target: Element
  // readonly #ptrlock: Element

  constructor(target: Element, _ptrlock: Element) {
    this.#target = target
    // this.#ptrlock = ptrlock
  }

  enter(orientation: number): Promise<void> {
    return this.#enter(orientation)
  }

  exit(): Promise<void> {
    return this.#exit()
  }

  async #enter(orientation: number): Promise<void> {
    if (this.#changing || isFullscreen()) return
    this.#changing = true
    const changed = await reqFullscreen(this.#target)
    // to-do: ptr lock.
    // if (changed) await reqPtrlock(this.#ptrlock)
    const lock = orientationLocks[orientation]
    if (changed && lock)
      try {
        await screen.orientation.lock(lock)
      } catch {}
    this.#changing = false
  }

  async #exit(): Promise<void> {
    if (this.#changing || !isFullscreen()) return
    this.#changing = true
    const changed = await exitFullscreen()
    if (changed)
      try {
        screen.orientation.unlock()
      } catch {}
    this.#changing = false
  }
}
