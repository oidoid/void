export function rgbaHex(rgba: number): `#${string}` {
  return `#${rgba.toString(16).padStart(8, '0')}`
}
