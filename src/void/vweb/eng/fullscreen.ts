import {
  exitFullscreen,
  isFullscreen,
  reqFullscreen
} from '../utils/fullscreen-util.ts'

/** orientation lock by window mode. */
const orientationLocks: readonly (OrientationLockType | undefined)[] = [
  undefined, // WindowModeWindowed.
  undefined, // WindowModeFullscreen.
  'portrait', // WindowModeFullscreenPortrait.
  'landscape' // WindowModeFullscreenLandscape.
]

export class Fullscreen {
  #changing: boolean = false
  readonly #target: Element
  // readonly #ptrlock: Element

  constructor(target: Element, _ptrlock: Element) {
    this.#target = target
    // this.#ptrlock = ptrlock
  }

  enter(mode: number): Promise<void> {
    return this.#enter(mode)
  }

  exit(): Promise<void> {
    return this.#exit()
  }

  async #enter(mode: number): Promise<void> {
    if (this.#changing || isFullscreen()) return
    this.#changing = true
    const changed = await reqFullscreen(this.#target)
    // to-do: ptr lock.
    // if (changed) await reqPtrlock(this.#ptrlock)
    const lock = orientationLocks[mode]
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
