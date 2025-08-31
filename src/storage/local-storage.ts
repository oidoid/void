// to-do: save to disk. https://github.com/GoogleChromeLabs/browser-fs-access

import type {PartialJSONValue} from '../types/json.ts'

export function saveJSON(k: string, v: PartialJSONValue): void {
  if (v == null) localStorage.removeItem(k)
  else localStorage.setItem(k, JSON.stringify(v))
}

export function loadJSON<T extends PartialJSONValue>(k: string): T | undefined {
  const v = localStorage.getItem(k)
  return v == null ? undefined : JSON.parse(v)
}
