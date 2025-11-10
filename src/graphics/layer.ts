/** greater is above. */
export const Layer = {
  Hidden: 0,
  Bottom: 1,
  A: 2,
  B: 3,
  C: 4,
  D: 5,
  E: 6,
  F: 7,
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

/** positive is above. returns [bottom, top]; hidden is out of domain. */
export function layerOffset(layer: Layer, offset: number): Layer {
  return Math.max(Layer.Bottom, Math.min(Layer.Top, layer + offset)) as Layer
}

export function isUILayer(layer: Layer): boolean {
  return layer >= Layer.UIA
}
