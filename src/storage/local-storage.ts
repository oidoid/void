import type {PartialJSONValue} from '../types/json.ts'

export function saveJSON<T extends PartialJSONValue>(k: string, v: T): void {
  if (v == null) localStorage.removeItem(k)
  else localStorage.setItem(k, JSON.stringify(v))
}

export function loadJSON<T extends PartialJSONValue>(k: string): T | undefined {
  const v = localStorage.getItem(k)
  return v == null ? undefined : JSON.parse(v)
}
