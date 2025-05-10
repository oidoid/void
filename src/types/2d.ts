export type WH = {w: number, h: number}
export type XY = {x: number, y: number}

export function xyAddTo(lhs: XY, rhs: Readonly<XY>): void {
  lhs.x += rhs.x
  lhs.y += rhs.y
}

export function xyDiv(lhs: Readonly<XY>, rhs: Readonly<XY>): XY {
  return {x: lhs.x / rhs.x, y: lhs.y / rhs.y}
}
