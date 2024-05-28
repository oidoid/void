/**
 * tiles are static square graphics arranged sequentially in the cam with an
 * optional type T (eg, Wall or Door). each tile's id maps to a wrapped location
 * in the tileset source image.
 *
 * tiles do not support animation, transparency, or stacking. collisions are
 * limited to tile granularity.
 */
export type Tileset<T> = {
  /** height in pixels. */
  readonly h: number
  /** tile dimensions in pixels. */
  readonly side: number
  readonly tile: readonly (T | undefined)[]
  /** width in pixels. */
  readonly w: number
}
