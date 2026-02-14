import type {WH} from '../types/geo.ts'

export type Tileset = {
  /** tile by ID. 0 is always `void--Nil`. */
  tiles: Tile[]
  tileWH: WH
}

export type LevelTiles = {
  /** level x-origin in pixels. usually a multiple of `Tileset.tileWH.w`. */
  x: number
  /** level y-origin in pixels. usually a multiple of `Tileset.tileWH.h`. */
  y: number
  /** level width in pixels. usually a multiple of `Tileset.tileWH.w`. */
  w: number
  /** level height in pixels. usually a multiple of `Tileset.tileWH.h`. */
  h: number
  /**
   * tile IDs in row-major order. length must be
   * `ceil(w / Tileset.tileWH.w) * ceil(h / Tileset.tileWH.h)`.
   */
  tiles: number[]
}

/** `--tagname-format={filestem}--{animation}`. */
export type Tile = 'void--Nil' | ReturnType<ReturnTile>

export interface ReturnTile {
  // biome-ignore lint/style/useShorthandFunctionType:;
  (): `${string}--${string}`
}

// to-do: tile util.
