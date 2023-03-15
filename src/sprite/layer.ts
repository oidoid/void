import { Immutable, U16, U8 } from '@/ooz'

/**
 * The render order.
 *
 * Sprites are rendered in the following order:
 * - Least layer (Layer.Top).
 * - Greatest y. When LayerByHeightFlag is set, height is included in this
 *   calculation (`y + h`). The default is to exclude height.
 * - Render instance position.
 *
 * See zDepth() in vertex.glsl.
 */
export const Layer = Immutable({
  Top: U8(0x01), // So that shader subtraction keeps layer >= 0.
  Cursor: U8(0x01),
  Bottom: U8(0x40), // Hidden
}) satisfies { [name: string]: U8 }
export type Layer = keyof typeof Layer

export const WrapXMask: U16 = U16(0b1111)
export const WrapXShift: number = 12
export const WrapYMask: U16 = U16(0b1111)
export const WrapYShift: number = 8

export const LayerShift: number = 0
export const LayerMask: U16 = U16(0b111_1111)

export const LayerByHeightShift: number = 7
export const LayerByHeightFlag: U16 = U16(0b1)
export const LayerByOriginFlag: U16 = U16(0b0)
export const LayerByHeightMask: U16 = U16(LayerByHeightFlag)
