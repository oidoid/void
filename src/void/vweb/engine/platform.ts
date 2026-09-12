export type Platform = {
  // linear memory shared between Go and JS.
  memory: WebAssembly.Memory
  // initialises the Go runtime and calls `main()`.
  _start(): void
  // byte offset into `memory` of the poll.
  PollPtr(): number
  BeepPtr(): number
  BeepCount(): number
  // consumes a pending fullscreen req.
  FullscreenReq(): number
  ScreenshotReq(): number
  ContextLossReq(): number
  DrawAlways(): number
  DrawOnBlur(): number
  ReqWakelock(): number
  RenderMode(): number
  UpdateInMillisReq(): bigint
  LayerConfigsPtr(): number
  Update(): Loop
  // byte offset into `memory` of the first tile.
  BoardTilesPtr(): number
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
  AtlasCelsPtr(): number
  AtlasCelsCount(): number
}

export type Loop = typeof LoopPause | typeof LoopLoop
export const LoopPause = 0 as const
export const LoopLoop = 1 as const

export const RenderModeFloat = 0 as const
export const RenderModePixel = 1 as const
export const FullscreenReqNone = 0 as const
export const FullscreenReqExit = 1 as const
export const FullscreenReqEnter = 2 as const
export const FullscreenReqPortrait = 3 as const
export const FullscreenReqLandscape = 4 as const
