import type {WH, XY} from '../types/geo.ts'

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

export function tileAt(
  tileset: Readonly<Tileset>,
  lvl: Readonly<LevelTiles>,
  xy: Readonly<XY>
): Tile | undefined {
  const id = tileIDAt(lvl, xy, tileset.tileWH)
  if (id == null) return
  return tileset.tiles[id]
}

export function tileIDAt(
  lvl: Readonly<LevelTiles>,
  xy: Readonly<XY>,
  tileWH: Readonly<WH>
): number | undefined {
  const col = Math.floor((xy.x - lvl.x) / tileWH.w)
  const row = Math.floor((xy.y - lvl.y) / tileWH.h)
  const cols = Math.ceil(lvl.w / tileWH.w)
  const rows = Math.ceil(lvl.h / tileWH.h)
  if (col < 0 || col >= cols || row < 0 || row >= rows) return
  return lvl.tiles[row * cols + col]
}
