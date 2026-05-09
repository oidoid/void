export type Border = {[dir in Lowercase<CardinalDir>]: number}

export type CardinalDir = 'N' | 'S' | 'W' | 'E'
export type CompassDir = 'Center' | CardinalDir | 'NW' | 'NE' | 'SW' | 'SE'



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


/** nonnegative. */
export function xyDistance(from: Readonly<XY>, to: Readonly<XY>): number {
  return xyMagnitude(xySub(from, to))
}

/** l / r. */
export function xyDiv(l: Readonly<XY>, r: Readonly<XY>): XY {
  return {x: l.x / r.x, y: l.y / r.y}
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
