import { Immutable, U8 } from '@/ooz'

/**
 * The render order.
 *
 * Sprites are rendered in the following order:
 * - Least layer (Layer.Top).
 * - Greatest y. When LayerByHeightFlag is set, height is included in this
 *   calculation (`y + h`). The default is to exclude height.
 * - Render instance position.
 *
 * See Bitmap and zDepth() in vertex.glsl.
 */
// to-do: can we increase to 127 or does this cause fighting?
export const Layer = Immutable({
  Top: U8(0x01), // So that shader subtraction keeps layer >= 0.
  Cursor: U8(0x01),
  Bottom: U8(0x40), // Hidden
}) satisfies { [name: string]: U8 }
export type Layer = keyof typeof Layer
