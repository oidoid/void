export function NonNull<T>(val: T, msg?: string): NonNullable<T> {
  if (val == null) throw Error(msg ?? 'expected nonnull')
  return val
}
