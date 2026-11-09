export function vibrate(...pattern: number[]): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- no Safari support.
  navigator.vibrate?.(pattern)
}
