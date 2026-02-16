export function assertRecord<T extends {[k: PropertyKey]: unknown}>(
  v: unknown,
  msg: string = 'not a record'
): asserts v is T {
  if (!isRecord(v)) throw new Error(msg)
}

export function isRecord<T extends {[k: PropertyKey]: unknown}>(
  v: unknown
): v is T {
  return v != null && !Array.isArray(v) && typeof v === 'object'
}
