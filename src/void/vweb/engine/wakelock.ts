export class Wakelock {
  #locking: boolean = false
  #sentinel?: WakeLockSentinel

  get locked(): boolean {
    return this.#sentinel != null
  }

  update(): void {
    if (document.visibilityState !== 'visible') {
      this.#unlock()
      return
    }
    if (this.locked || this.#locking || !navigator.wakeLock) return
    void this.#lock(navigator.wakeLock)
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
    if (document.visibilityState !== 'visible') {
      await this.#releaseSentinel(sentinel)
      return
    }
    this.#sentinel = sentinel
    sentinel.addEventListener('release', () => {
      if (this.#sentinel !== sentinel) return
      this.#sentinel = undefined
      this.update()
    })
  }

  #unlock(): void {
    const sentinel = this.#sentinel
    this.#sentinel = undefined
    if (sentinel) void this.#releaseSentinel(sentinel)
  }

  async #releaseSentinel(sentinel: WakeLockSentinel): Promise<void> {
    try {
      await sentinel.release()
    } catch {}
  }
}
