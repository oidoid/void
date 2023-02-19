import { JSONValue } from '@/ooz'

export namespace JSONStorage {
  export function clear(storage: Storage): void {
    storage.clear()
  }

  export function get<T>(
    self: Storage,
    key: string,
  ): T & JSONValue | undefined {
    const val = self.getItem(key)
    return val == null ? undefined : JSON.parse(val)
  }

  export function put(
    self: Storage,
    key: string,
    val: JSONValue | undefined,
  ): void {
    if (val == null) self.removeItem(key)
    else self.setItem(key, JSON.stringify(val))
  }
}
