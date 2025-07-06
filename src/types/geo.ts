export type Box = XY & WH
export type WH = {w: number, h: number}
export type XY = {x: number, y: number}
export type XYZ = {x: number, y: number, z: number}

// to-do: why do I need partial xy lhs
export function boxHits(
  lhs: Readonly<Partial<XY> & WH>,
  rhs: Readonly<XY & Partial<WH>>
): boolean {
  const rhsWH = {w: rhs.w ?? 1, h: rhs.h ?? 1} // point? an empty box has no w/h.
  if (!lhs.w || !lhs.h || !rhsWH.w || !rhsWH.h) return false // noncommutative.
  return (
    (lhs.x ?? 0) < rhs.x + rhsWH.w
    && (lhs.x ?? 0) + lhs.w > rhs.x
    && (lhs.y ?? 0) < rhs.y + rhsWH.h
    && (lhs.y ?? 0) + lhs.h > rhs.y
  )
}

/** lhs + rhs. */
export function xyAdd(lhs: Readonly<XY>, rhs: Readonly<XY>): XY {
  return {x: lhs.x + rhs.x, y: lhs.y + rhs.y}
}

/** lhs += rhs. */
export function xyAddTo(lhs: XY, rhs: Readonly<XY>): void {
  lhs.x += rhs.x
  lhs.y += rhs.y
}

/** nonnegative. */
export function xyDistance(from: Readonly<XY>, to: Readonly<XY>): number {
  return xyMagnitude(xySub(from, to))
}

/** lhs / rhs. */
export function xyDiv(lhs: Readonly<XY>, rhs: Readonly<XY>): XY {
  return {x: lhs.x / rhs.x, y: lhs.y / rhs.y}
}

export function xyEq(lhs: Readonly<XY>, rhs: Readonly<XY>): boolean {
  return lhs.x === rhs.x && lhs.y === rhs.y
}

/** nonnegative. */
export function xyMagnitude(xy: Readonly<XY>): number {
  return Math.sqrt(xy.x * xy.x + xy.y * xy.y)
}

/** the greater of each component. */
export function xyMax(lhs: Readonly<XY>, rhs: Readonly<XY>): XY {
  return {x: Math.max(lhs.x, rhs.x), y: Math.max(lhs.y, rhs.y)}
}

/** the lesser of each component. */
export function xyMin(lhs: Readonly<XY>, rhs: Readonly<XY>): XY {
  return {x: Math.min(lhs.x, rhs.x), y: Math.min(lhs.y, rhs.y)}
}

export function xyStr(xy: Readonly<XY>): string {
  return `(${xy.x}, ${xy.y})`
}

/** lhs - rhs. */
export function xySub(lhs: Readonly<XY>, rhs: Readonly<XY>): XY {
  return {x: lhs.x - rhs.x, y: lhs.y - rhs.y}
}
