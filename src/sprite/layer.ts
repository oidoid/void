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

export const WrapMask: U16 = U16(0b1111_1111_0000_0000)
export const LayerMask: U16 = U16(0b0000_0000_0111_1111)
export const LayerByHeightShift: number = 7
export const LayerByHeightFlag: U16 = U16(0b1000_0000)
export const LayerByHeightMask: U16 = U16(LayerByHeightFlag)

// to-do: i had some notes on how to pattern bitmasks a lot better. figure it out
// the masking terms / pattern. fixing the number types
// shifted values / flags

// WrapXWidth = 4
// WrapXShift = 12
// WrapXMask = mask(WrapXWidth, WrapXShift)

// WrapYWidth = 4
// WrapYShift = 8
// WrapYMask = mask(WrapYWidth, WrapYShift)

// const MaxX = I16.max;
// const MaxY = 16 * 1024; //shader
