/** [0 (bottom), 15 (top)]; lower is lower, greater is above. */
export const Layer = {
  Bottom: 0,
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  UIA: 8,
  UIB: 9,
  UIC: 10,
  UID: 11,
  UIE: 12,
  UIF: 13,
  UIG: 14,
  Top: 15
} as const
export type Layer = (typeof Layer)[keyof typeof Layer]

/** positive is above. returns [bottom, top]. */
export function layerOffset(layer: Layer, offset: number): Layer {
  return Math.max(Layer.Bottom, Math.min(Layer.Top, layer + offset)) as Layer
}

/** true if UI or top layer. */
export function isUILayer(layer: Layer): boolean {
  return layer >= Layer.UIA
}
