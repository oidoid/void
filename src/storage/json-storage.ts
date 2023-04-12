import { JSONValue } from '@/ooz'

export class JSONStorage {
  #storage: Storage
  constructor(storage: Storage) {
    this.#storage = storage
  }

  clear(): void {
    this.#storage.clear()
  }

  get<T>(key: string): T & JSONValue | undefined {
    const val = this.#storage.getItem(key)
    return val == null ? undefined : JSON.parse(val)
  }

  put(key: string, val: JSONValue | undefined): void {
    if (val == null) this.#storage.removeItem(key)
    else this.#storage.setItem(key, JSON.stringify(val))
  }
}
