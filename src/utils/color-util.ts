export function rgbaHex(rgba: number): `#${string}` {
  return `#${rgba.toString(16).padStart(8, '0')}`
}

/**
 * for use with `getComputedStyle()` format. eg, `rgba(255, 255, 255, 1)` to
 * xffffffff. percentage unsupported.
 */
export function parseComputedColor(rgba: string): number {
  const [r, g, b, a] = rgba.match(/[0-9.]+/g)?.map(Number) ?? []
  return (
    ((Math.round(r ?? 0) << 24) |
      (Math.round(g ?? 0) << 16) |
      (Math.round(b ?? 0) << 8) |
      Math.round((a ?? 1) * 255)) >>>
    0
  )
}
