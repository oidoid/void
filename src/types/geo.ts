export type Box = XY & WH
export type WH = {w: number; h: number}
export type XY = {x: number; y: number}
export type XYZ = {x: number; y: number; z: number}

// to-do: why do I need partial xy l
export function boxHits(
  l: Readonly<Partial<XY> & WH>,
  r: Readonly<XY & Partial<WH>>
): boolean {
  const rWH = {w: r.w ?? 1, h: r.h ?? 1} // point? an empty box has no w/h.
  if (!l.w || !l.h || !rWH.w || !rWH.h) return false // noncommutative.
  return (
    (l.x ?? 0) < r.x + rWH.w &&
    (l.x ?? 0) + l.w > r.x &&
    (l.y ?? 0) < r.y + rWH.h &&
    (l.y ?? 0) + l.h > r.y
  )
}

export function whEq(l: Readonly<WH>, r: Readonly<WH>): boolean {
  return l.w === r.w && l.h === r.h
}

/** l + r. */
export function xyAdd(l: Readonly<XY>, r: Readonly<XY>): XY {
  return {x: l.x + r.x, y: l.y + r.y}
}

/** l += r. */
export function xyAddTo(l: XY, r: Readonly<XY>): void {
  l.x += r.x
  l.y += r.y
}

/** nonnegative. */
export function xyDistance(from: Readonly<XY>, to: Readonly<XY>): number {
  return xyMagnitude(xySub(from, to))
}

/** l / r. */
export function xyDiv(l: Readonly<XY>, r: Readonly<XY>): XY {
  return {x: l.x / r.x, y: l.y / r.y}
}

export function xyEq(l: Readonly<XY>, r: Readonly<XY>): boolean {
  return l.x === r.x && l.y === r.y
}

/** nonnegative. */
export function xyMagnitude(xy: Readonly<XY>): number {
  return Math.hypot(xy.x, xy.y)
}

/** the greater of each component. */
export function xyMax(l: Readonly<XY>, r: Readonly<XY>): XY {
  return {x: Math.max(l.x, r.x), y: Math.max(l.y, r.y)}
}

/** the lesser of each component. */
export function xyMin(l: Readonly<XY>, r: Readonly<XY>): XY {
  return {x: Math.min(l.x, r.x), y: Math.min(l.y, r.y)}
}

/** l - r. */
export function xySub(l: Readonly<XY>, r: Readonly<XY>): XY {
  return {x: l.x - r.x, y: l.y - r.y}
}
