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

