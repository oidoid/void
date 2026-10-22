import type {XYWH} from '../geo/box.ts'

/** board data needed to create or update the tile renderer. */
export type BoardConfig = {
  /** invalidated bounds in tile coordinates, with exclusive right/bottom. */
  dirty: Readonly<XYWH>
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
