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
   * - 1b flip x
   * - 1b flip y
   * - 4b signed x texture offset (wrap).
   * - 4b signed y texture offset (wrap).
   * - 1b layer anchor.
   * - 7b layer.
   */
  readonly flipWrapAnchorLayer: number
}

export const BitmapFlipXMask = 0b1
export const BitmapFlipXShift = 17

export const BitmapFlipYMask = 0b1
export const BitmapFlipYShift = 16

export const BitmapWrapXMask = 0b1111
export const BitmapWrapXShift = 12
export const BitmapWrapXWidth = 4
export const BitmapWrapYMask = 0b1111
export const BitmapWrapYShift = 8
export const BitmapWrapYWidth = 4

export const BitmapLayerAnchorEndMask = 0b1
export const BitmapLayerAnchorEndShift = 7

export const BitmapLayerMask = 0b111_1111
export const BitmapLayerShift = 0
