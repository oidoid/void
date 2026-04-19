export type WasmAPI = {
  // linear memory shared between Go and JS.
  memory: WebAssembly.Memory
  // initialises the Go runtime and calls `main()`.
  _start(): void
  // byte offset into `memory` of the update.
  GetUpdatePointer(): number
  // byte offset into `memory` of the first sprite.
  GetSpritePointer(): number
  // number of sprites to draw this frame.
  GetSpriteCount(): number
  Update(): Loop
  // byte offset into `memory` of the first tile.
  GetTilePointer(): number
  // total number of tiles.
  GetTileCount(): number
  // level origin and size in pixels.
  GetLevelX(): number
  GetLevelY(): number
  GetLevelW(): number
  GetLevelH(): number
  // tile pixel dimensions.
  GetLevelTileW(): number
  GetLevelTileH(): number
  // camera position in world pixels.
  GetCamX(): number
  GetCamY(): number
}

export type Loop = typeof LoopPause | typeof LoopLoop
export const LoopPause = 0 as const
export const LoopLoop = 1 as const
