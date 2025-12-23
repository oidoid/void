export function assertRecord<T extends {[k: PropertyKey]: unknown}>(
  v: unknown
): asserts v is T {
  if (!isRecord(v)) throw new Error('not a record')
}

export function isRecord<T extends {[k: PropertyKey]: unknown}>(
  v: unknown
): v is T {
  return v != null && !Array.isArray(v) && typeof v === 'object'
}
