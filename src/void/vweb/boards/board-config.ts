/** board data needed to create or update the tile renderer. */
export type BoardConfig = {
  /** generated Tiled level ID; zero represents no level. */
  lvl: number
  /** packed board tiles viewed in current Wasm memory. */
  tiles: Uint16Array
  /** board width in world pixels. */
  w: number
  /** board height in world pixels. */
  h: number
  /** tile width in pixels. */
  tileW: number
  /** tile height in pixels. */
  tileH: number
}
