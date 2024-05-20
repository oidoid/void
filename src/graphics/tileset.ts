/**
 * tiles are static square graphics arranged sequentially in the cam with an
 * optional type T (eg, Wall or Door). each tile's id maps to a wrapped location
 * in the tileset source image.
 *
 * tiles do not support animation, transparency, or stacking. collisions are
 * limited to tile granularity.
 */
export type Tileset<T> = {
  /** Height in pixels. */
  readonly h: number
  /** Tile dimensions in pixels. */
  readonly side: number
  readonly tile: readonly (T | undefined)[]
  /** Width in pixels. */
  readonly w: number
}
