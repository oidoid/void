/** @typedef {XY & WH} Box */
/** @typedef {{w: number, h: number}} WH */
/** @typedef {{x: number, y: number}} XY */

/**
 * @arg {Readonly<Box>} lhs
 * @arg {Readonly<XY & Partial<WH>>} rhs
 * @return {boolean}
 */
export function boxHits(lhs, rhs) {
  const rw = rhs.w ?? 0 // point.
  const rh = rhs.h ?? 0
  if (lhs.w < 0 || lhs.h < 0 || rw < 0 || rh < 0) return false // flipped.
  return (
    lhs.x < rhs.x + rw &&
    lhs.x + lhs.w > rhs.x &&
    lhs.y < rhs.y + rh &&
    lhs.y + lhs.h > rhs.y
  )
}
