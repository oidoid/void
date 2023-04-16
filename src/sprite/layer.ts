/**
 * The render order.
 *
 * Sprites are rendered in the following order:
 * - Least layer (Layer.Top).
 * - Greatest y. When BitmapLayerAnchorEnd is set, height is included in this
 *   calculation (`y + h`). The default is to exclude height.
 * - Render instance position.
 *
 * See Bitmap and zDepth() in vertex.glsl.
 */
// to-do: can we increase to 127 or does this cause fighting?
export const Layer = {
  Top: 0x01, // So that shader subtraction keeps layer >= 0.
  Cursor: 0x01,
  Bottom: 0x40, // Hidden
} satisfies { [name: string]: number }
export type Layer = keyof typeof Layer
