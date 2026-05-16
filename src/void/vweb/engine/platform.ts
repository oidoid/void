export type Platform = {
  // linear memory shared between Go and JS.
  memory: WebAssembly.Memory
  // initialises the Go runtime and calls `main()`.
  _start(): void
  // to-do: better name for "frame"?
  // byte offset into `memory` of the frame.
  FramePointer(): number
  // byte offset into `memory` of the first sprite.
  SpritePointer(): number
  // number of sprites to draw this frame.
  SpriteCount(): number
  Update(): Loop
  // byte offset into `memory` of the first tile.
  TilePointer(): number
  // total number of tiles.
  TileCount(): number
  // level origin and size in pixels.
  LevelX(): number
  LevelY(): number
  LevelW(): number
  LevelH(): number
  // tile pixel dimensions.
  LevelTileW(): number
  LevelTileH(): number
  // camera position in world pixels.
  CamX(): number
  CamY(): number
  AtlasAnimCount(): number
  AtlasCelsPerAnim(): number
  AtlasCelsPointer(): number
  AtlasCelsCount(): number
}

export type Loop = typeof LoopPause | typeof LoopLoop
export const LoopPause = 0 as const
export const LoopLoop = 1 as const
