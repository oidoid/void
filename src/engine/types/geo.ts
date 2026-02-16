export type Border = {[dir in Lowercase<CardinalDir>]: number}

export type Box = XY & WH
export type WH = {w: number; h: number}
export type XY = {x: number; y: number}
export type XYZ = {x: number; y: number; z: number}

export type CardinalDir = 'N' | 'S' | 'W' | 'E'
export type CompassDir = 'Center' | CardinalDir | 'NW' | 'NE' | 'SW' | 'SE'

export function boxAssign(l: Box, r: Readonly<Box>): void {
  l.x = r.x
  l.y = r.y
  l.w = r.w
  l.h = r.h
}

export function boxEq(l: Readonly<Box>, r: Readonly<Box>): boolean {
  return xyEq(l, r) && whEq(l, r)
}

// to-do: this is an example where I do want the helper. it's so errorprone to write this.
export function borderEq(l: Readonly<Border>, r: Readonly<Border>): boolean {
  return l.n === r.n && l.s === r.s && l.w === r.w && l.e === r.e
}

export function borderAssign(l: Border, r: Readonly<Border>): void {
  l.n = r.n
  l.s = r.s
  l.w = r.w
  l.e = r.e
}

export function boxHits(
  l: Readonly<Partial<XY> & WH>,
  r: Readonly<XY & Partial<WH>>
): boolean {
  const rWH = {w: r.w ?? 1, h: r.h ?? 1} // point? an empty box has no w/h.
  if (!l.w || !l.h || !rWH.w || !rWH.h) return false // noncommutative.
  const lXY = {x: l.x ?? 0, y: l.y ?? 0}
  return (
    lXY.x < r.x + rWH.w &&
    lXY.x + l.w > r.x &&
    lXY.y < r.y + rWH.h &&
    lXY.y + l.h > r.y
  )
}

/** overlap of boxes or a flipped box. */
export function boxIntersect(l: Readonly<Box>, r: Readonly<Box>): Box {
  const x = Math.max(l.x, r.x)
  const y = Math.max(l.y, r.y)
  return {
    x,
    y,
    w: Math.min(l.x + l.w, r.x + r.w) - x,
    h: Math.min(l.y + l.h, r.y + r.h) - y
  }
}

export function whAssign(l: WH, r: Readonly<WH>): void {
  l.w = r.w
  l.h = r.h
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

export function xyAssign(l: XY, r: Readonly<XY>): void {
  l.x = r.x
  l.y = r.y
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
