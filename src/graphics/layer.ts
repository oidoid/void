export const Layer = {
  UITop: 0,
  UIA: 1,
  UIB: 2,
  UIC: 3,
  UID: 4,
  UIE: 5,
  UIF: 6,
  UIBottom: 7,
  Top: 8,
  A: 9,
  B: 10,
  C: 11,
  D: 12,
  E: 13,
  Bottom: 14,
  Hidden: 15
} as const
export type Layer = (typeof Layer)[keyof typeof Layer]
