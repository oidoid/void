export function vibrate(...pattern: number[]): void {
  navigator.vibrate?.(pattern)
}
