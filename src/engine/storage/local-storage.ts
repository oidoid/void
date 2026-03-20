import type {PartialJSONValue} from '../types/json.ts'

export function localStorageGetJSON<T extends PartialJSONValue>(
  k: string
): T | undefined {
  const v = localStorage.getItem(k)
  return v == null ? undefined : JSON.parse(v)
}

export function localStoragePutJSON<T extends PartialJSONValue>(
  k: string,
  v: T
): void {
  if (v == null) localStorage.removeItem(k)
  else localStorage.setItem(k, JSON.stringify(v))
}
