/** greater is above. */
export const Layer = {
  Top: 15,
  UIG: 14,
  UIF: 13,
  UIE: 12,
  UID: 11,
  UIC: 10,
  UIB: 9,
  UIA: 8,
  F: 7,
  E: 6,
  D: 5,
  C: 4,
  B: 3,
  A: 2,
  Bottom: 1,
  Hidden: 0
} as const
export type Layer = (typeof Layer)[keyof typeof Layer]

/** positive is above. returns [bottom, top]; hidden is out of domain. */
export function layerOffset(layer: Layer, offset: number): Layer {
  return Math.max(Layer.Bottom, Math.min(Layer.Top, layer + offset)) as Layer
}

export function isUILayer(layer: Layer): boolean {
  return layer >= Layer.UIA
}
