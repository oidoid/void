import { Cel } from '@/atlas-pack'
import { Box, I16, U16 } from '@/ooz'

/** Tightly coupled to ShaderLayout and GLSL. */
export interface Bitmap extends Box<I16> {
  cel(time: number): Cel
  /**
   * From left-to-right:
   * - 4b signed x texture offset (wrap).
   * - 4b signed y texture offset (wrap).
   * - 1b layer by start.
   * - 7b layer.
   */
  readonly wrapLayerByHeightLayer: U16
}

export const WrapXMask: U16 = U16(0b1111)
export const WrapXShift: number = 12
export const WrapYMask: U16 = U16(0b1111)
export const WrapYShift: number = 8

export const LayerShift: number = 0
export const LayerMask: U16 = U16(0b111_1111)

export const LayerByHeightShift: number = 7
export const LayerByHeightFlag: U16 = U16(0b1)
export const LayerByOriginFlag: U16 = U16(0b0)
export const LayerByHeightMask: U16 = U16(0b1)
