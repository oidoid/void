export class Wakelock {
  onChange: (() => void) | undefined
  #enabled: boolean = false
  #locking: boolean = false
  #sentinel?: WakeLockSentinel

  get locked(): boolean {
    return this.#sentinel != null
  }

  set enabled(enabled: boolean) {
    this.#enabled = enabled
    this.#update()
  }

  async #lock(api: WakeLock): Promise<void> {
    this.#locking = true
    let sentinel: WakeLockSentinel
    try {
      sentinel = await api.request('screen')
    } catch {
      this.#locking = false
      return
    }
    this.#locking = false
    if (!this.#enabled || document.visibilityState !== 'visible') {
      await this.#releaseSentinel(sentinel)
      return
    }
    this.#sentinel = sentinel
    this.onChange?.()
    sentinel.addEventListener('release', () => {
      if (this.#sentinel !== sentinel) return
      this.#sentinel = undefined
      this.onChange?.()
      this.#update()
    })
  }

  #unlock(): void {
    const sentinel = this.#sentinel
    this.#sentinel = undefined
    if (sentinel) void this.#releaseSentinel(sentinel)
    if (sentinel) this.onChange?.()
  }

  #update(): void {
    const lock = this.#enabled && document.visibilityState === 'visible'
    if (this.locked === lock) return
    if (!lock) {
      this.#unlock()
      return
    }
    if (this.#locking) return
    if (!navigator.wakeLock) return
    void this.#lock(navigator.wakeLock)
  }

  async #releaseSentinel(sentinel: WakeLockSentinel): Promise<void> {
    try {
      await sentinel.release()
    } catch {}
  }
}
