export type Platform = {
  // linear memory shared between Go and JS.
  memory: WebAssembly.Memory
  // initialises the Go runtime and calls `main()`.
  _start(): void
  // to-do: better name for "frame"?
  // byte offset into `memory` of the frame.
  FramePointer(): number
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
  TilePointer(): number
  // level size in pixels. origin is always `(0, 0)`.
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
export const renderModeFloat = 0 as const
export const renderModePixel = 1 as const

export const LoopLoop = 1 as const
