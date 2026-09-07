import {
  exitFullscreen,
  isFullscreen,
  requestFullscreen
} from '../utils/fullscreen-util.ts'

export class Fullscreen {
  onChange: (() => void) | undefined
  #enabled: boolean = false
  #changing: boolean = false
  readonly #target: Element
  // readonly #ptrlock: Element

  constructor(target: Element, _ptrlock: Element) {
    this.#target = target
    // this.#ptrlock = ptrlock
  }

  set enabled(enabled: boolean) {
    this.#enabled = enabled
    void this.#update()
  }

  onInput(): void {
    void this.#update()
  }

  async #update(): Promise<void> {
    if (this.#changing || this.#enabled === isFullscreen()) return
    this.#changing = true
    const enabled = this.#enabled
    const changed = enabled
      ? await requestFullscreen(this.#target)
      : await exitFullscreen()
    // to-do: ptr lock.
    // if (changed && enabled) await requestPtrlock(this.#ptrlock)
    this.#changing = false
    if (changed) this.onChange?.()
    if (enabled !== this.#enabled) void this.#update()
  }
}
