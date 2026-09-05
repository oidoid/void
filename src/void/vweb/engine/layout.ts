/** max concurrent pointers tracked (one per finger). */
export const maxPointers: number = 5
/** bytes per PointerPoll. */
export const pollSize: number = 32
/** byte offset of the pointer array within Update (PointersLen uint8 + 3 pad). */
export const pollsOffset: number = 4
/** byte offset of WheelPoll within Update. */
export const wheelOffset: number = pollsOffset + maxPointers * pollSize
/** byte offset of KeyboardPoll within Update (WheelPoll = 12 bytes). */
export const keyboardOffset: number = wheelOffset + 12
/** byte offset of TextLen field within KeyboardPoll (after Keys uint16 = 2 bytes). */
export const keyboardTextLenOffset: number = keyboardOffset + 2
/** byte offset of Text field within KeyboardPoll (after Keys + TextLen = 4 bytes). */
export const keyboardTextOffset: number = keyboardOffset + 4
/** byte offset of TextOverflow field within KeyboardPoll (after Text = 4100 bytes). */
export const keyboardTextOverflowOffset: number = keyboardOffset + 4100
/** max text bytes. */
export const maxTextLen: number = 4096
/** byte offset of the gamepadsLen field within Update (KeyboardPoll = 4102 bytes). */
export const gamepadsLenOffset: number = keyboardOffset + 4102
/** byte offset of the gamepad array within Update (gamepadsLen + 1 pad). */
export const gamepadsOffset: number = gamepadsLenOffset + 2
/** bytes per GamepadPoll. */
export const gamepadPollSize: number = 24
/** max concurrent gamepads tracked. */
export const maxGamepads: number = 4
/** byte offset of DeltaMs field within Update. */
export const deltaMsOffset: number =
  gamepadsOffset + maxGamepads * gamepadPollSize
/** byte offset of NowMs field within Update. */
export const nowMsOffset: number = deltaMsOffset + 8
/** byte offset of UTC milliseconds within Update. */
export const utcMsOffset: number = nowMsOffset + 8
/** byte offset of CanvasW field within Update (CSS logical px). */
export const canvasWOffset: number = utcMsOffset + 8
/** byte offset of CanvasH field within Update (CSS logical px). */
export const canvasHOffset: number = canvasWOffset + 2
/** byte offset of Fullscreen field within Update. */
export const isFullscreenOffset: number = canvasHOffset + 2
/** byte offset of DrawAlways field within Update. */
export const drawAlwaysOffset: number = isFullscreenOffset + 1
/** byte offset of URL wakelock request within Update. */
export const requestWakelockOffset: number = drawAlwaysOffset + 1
/** byte offset of browser-confirmed wakelocked field within Update. */
export const wakelockedOffset: number = requestWakelockOffset + 1
/** byte offset of DrawCount field (number of renderer clears completed). */
export const drawCountOffset: number = isFullscreenOffset + 4
/** byte offset of URL fullscreen request within Update. */
export const requestFullscreenOffset: number = drawCountOffset + 4
/** byte offset of browser-confirmed pointerlock within Update. */
export const pointerlockedOffset: number = requestFullscreenOffset + 1
/** byte offset of UpdateMs field (duration of the previous Go update call, milliseconds). */
export const updateMsOffset: number = drawCountOffset + 8
/** byte offset of DevicePixelRatio field within Update. */
export const devicePixelRatioOffset: number = updateMsOffset + 8
/** byte offset of local year field within Update. */
export const localYearOffset: number = devicePixelRatioOffset + 8
/** byte offset of local month field within Update. */
export const localMonthOffset: number = localYearOffset + 2
/** byte offset of local day field within Update. */
export const localDayOffset: number = localMonthOffset + 1
/** byte offset of local hour field within Update. */
export const localHourOffset: number = localDayOffset + 1
/** byte offset of local minute field within Update. */
export const localMinuteOffset: number = localHourOffset + 1
/** byte offset of local second field within Update. */
export const localSecondOffset: number = localMinuteOffset + 1
/** byte offset of local millisecond field within Update. */
export const localMillisOffset: number = localHourOffset + 4
/** total byte size of the Update struct. */
export const updateByteLen: number = localYearOffset + 16

export const sprTagCelOffset: number = 8
export const sprZOffset: number = 10
export const sprWHOffset: number = 12
export const sprFlagsOffset: number = 16
export const sprStride: number = 20
export const layerCount: number = 8

export const layerConfigCamModeOffset: number = 0
export const layerConfigShaderOffset: number = 1
export const layerConfigFlagsOffset: number = 2
export const layerFlagsDepthShift = 0 as const
export const layerFlagsDepthFlag = 1 as const
export const layerFlagsDepthMask = layerFlagsDepthFlag
export const layerFlagsBlendModeShift = 1 as const
export const layerFlagsBlendModeMask = 0x3 as const
export const layerConfigClipXPhyOffset: number = 4
export const layerConfigClipYPhyOffset: number = 6
export const layerConfigClipWPhyOffset: number = 8
export const layerConfigClipHPhyOffset: number = 10
export const layerConfigScaleOffset: number = 12
export const layerConfigSprsPtrOffset: number = 16
export const layerConfigSprCountOffset: number = 20
export const layerConfigStride: number = 24

export const layerCamModeApply = 0 as const
export const layerCamModeFixed = 1 as const
export type LayerCamMode = typeof layerCamModeApply | typeof layerCamModeFixed
export const layerBlendModeAlpha = 0 as const
export const layerBlendModeMultiply = 1 as const
export const layerBlendModeReplace = 2 as const
export type LayerBlendMode =
  | typeof layerBlendModeAlpha
  | typeof layerBlendModeMultiply
  | typeof layerBlendModeReplace

export const shaderTiles = 0 as const
export const shaderSprs = 1 as const
export const shaderOverlay = 2 as const
export type Shader =
  | typeof shaderTiles
  | typeof shaderSprs
  | typeof shaderOverlay

export type LayerConfig = {
  clipPhy: {x: number; y: number; w: number; h: number}
  camMode: LayerCamMode
  scale: number
  shader: Shader
  depth: boolean
  blendMode: LayerBlendMode
  sprsPtr: number
  sprCount: number
}
