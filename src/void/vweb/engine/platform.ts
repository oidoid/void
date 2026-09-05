export type Platform = {
  // linear memory shared between Go and JS.
  memory: WebAssembly.Memory
  // initialises the Go runtime and calls `main()`.
  _start(): void
  // byte offset into `memory` of the poll.
  PollPointer(): number
  BeepPointer(): number
  BeepCount(): number
  // consumes a pending fullscreen request: 0 none, 1 enter, 2 exit.
  FullscreenRequest(): number
  ScreenshotRequest(): number
  ContextLossRequest(): number
  DrawAlways(): number
  RequestWakelock(): number
  RenderMode(): number
  UpdateInMillisRequest(): bigint
  LayerConfigsPointer(): number
  Update(): Loop
  // byte offset into `memory` of the first tile.
  BoardTilesPointer(): number
  // board size in pixels. origin is always `(0, 0)`.
  BoardW(): number
  BoardH(): number
  // tile pixel dimensions.
  BoardTileW(): number
  BoardTileH(): number
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

export const renderModeFloat = 0 as const
export const renderModePixel = 1 as const
