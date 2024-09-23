export type Box = XY & WH
export type WH = {w: number; h: number}
export type XY = {x: number; y: number}

export function boxHits(
  lhs: Readonly<Box>,
  rhs: Readonly<XY & Partial<WH>>
): boolean {
  const rw = rhs.w ?? 0 // point.
  const rh = rhs.h ?? 0
  // rhs may be a point or a box. comparison is commutative.
  if (lhs.w < 0 || lhs.h < 0 || rw < 0 || rh < 0) return false // flipped.
  return (
    lhs.x < rhs.x + rw &&
    lhs.x + lhs.w > rhs.x &&
    lhs.y < rhs.y + rh &&
    lhs.y + lhs.h > rhs.y
  )
}
