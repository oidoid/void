import { Cel } from '@/atlas-pack'

/** Tightly coupled to ShaderLayout and GLSL. */
export interface Bitmap {
  x: number
  y: number
  w: number
  h: number
  cel(time: number): Cel
  /**
   * From left-to-right:
   * - 4b signed x texture offset (wrap).
   * - 4b signed y texture offset (wrap).
   * - 1b layer by start.
   * - 7b layer.
   */
  readonly wrapLayerByHeightLayer: number
}

export const WrapXMask = 0b1111
export const WrapXShift = 12
export const WrapXWidth = 4
export const WrapYMask = 0b1111
export const WrapYShift = 8
export const WrapYWidth = 4

export const LayerShift = 0
export const LayerMask = 0b111_1111

export const LayerByHeightShift = 7
export const LayerByHeightFlag = 0b1
export const LayerByOriginFlag = 0b0
export const LayerByHeightMask = 0b1
