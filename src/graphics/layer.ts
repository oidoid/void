export const Layer = {
  Top: 0,
  UIA: 1,
  UIB: 2,
  UIC: 3,
  UID: 4,
  UIE: 5,
  UIF: 6,
  UIG: 7,
  A: 8,
  B: 9,
  C: 10,
  D: 11,
  E: 12,
  F: 13,
  Bottom: 14,
  Hidden: 15
} as const
export type Layer = (typeof Layer)[keyof typeof Layer]

/** negative is above. returns [top, bottom]; hidden is out of domain. */
export function layerOffset(layer: Layer, offset: number): Layer {
  return Math.max(Layer.Top, Math.min(Layer.Bottom, layer + offset)) as Layer
}

export function isUILayer(layer: Layer): boolean {
  return layer < Layer.A
}
