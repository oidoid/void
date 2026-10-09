// codegen by genbridge.

export const maxPtrs: number = 5
export const maxGamepads: number = 4
export const maxTextLen: number = 4096

export const keyUp: number = 1
export const keyDown: number = 2
export const keyLeft: number = 4
export const keyRight: number = 8
export const keyA: number = 16
export const keyB: number = 32
export const keyC: number = 64
export const keyMenu: number = 128
export const keyBack: number = 256
export const ptrDevUnknown: 0 = 0
export const ptrDevMouse: 1 = 1
export const ptrDevPen: 2 = 2
export const ptrDevTouch: 3 = 3

export const pollSize: number = 32
export const gamepadPollSize: number = 24
export const updateByteLen: number = 4448
export const ptrsLenOffset: number = 0
export const pollsOffset: number = 4
export const wheelOffset: number = 164
export const keyboardOffset: number = 176
export const keyboardTextLenOffset: number = 178
export const keyboardTextOffset: number = 180
export const keyboardTextOverflowOffset: number = 4276
export const gamepadsLenOffset: number = 4278
export const gamepadsOffset: number = 4280
export const deltaMsOffset: number = 4376
export const nowMsOffset: number = 4384
export const utcMsOffset: number = 4392
export const canvasWOffset: number = 4400
export const canvasHOffset: number = 4402
export const isFullscreenOffset: number = 4404
export const drawAlwaysOffset: number = 4405
export const drawCountOffset: number = 4408
export const fullscreenReqOffset: number = 4412
export const ptrlockedOffset: number = 4413
export const updateMsOffset: number = 4416
export const devicePixelRatioOffset: number = 4424
export const localYearOffset: number = 4432
export const localMonthOffset: number = 4434
export const localDayOffset: number = 4435
export const localHourOffset: number = 4436
export const localMinuteOffset: number = 4437
export const localSecondOffset: number = 4438
export const localMillisOffset: number = 4440

export const ptrIDOffset: number = 0
export const ptrMinXOffset: number = 4
export const ptrMinYOffset: number = 8
export const ptrMaxXOffset: number = 12
export const ptrMaxYOffset: number = 16
export const ptrPressureOffset: number = 20
export const ptrTiltXOffset: number = 24
export const ptrTiltYOffset: number = 25
export const ptrTwistOffset: number = 26
export const ptrDeviceOffset: number = 28
export const ptrPrimaryOffset: number = 29
export const ptrClicksOffset: number = 30

export const wheelDeltaXOffset: number = 0
export const wheelDeltaYOffset: number = 4
export const wheelDeltaZOffset: number = 8

export const gamepadIndexOffset: number = 0
export const gamepadConnectedOffset: number = 1
export const gamepadMappingOffset: number = 2
export const gamepadButtonsOffset: number = 4
export const gamepadAxesOffset: number = 8

export const gamepadAxisStride: number = 4

export const outByteLen: number = 512
export const outUpdateInMillisOffset: number = 0
export const outCamOffset: number = 8
export const outBoardTilesPtrOffset: number = 16
export const outBoardTilesLenOffset: number = 20
export const outBoardWOffset: number = 24
export const outBoardHOffset: number = 28
export const outBoardLevelOffset: number = 32
export const outBoardTileWOffset: number = 34
export const outBoardTileHOffset: number = 35
export const outAtlasCelsPtrOffset: number = 36
export const outAtlasCelsCountOffset: number = 40
export const outAtlasAnimCountOffset: number = 44
export const outAtlasCelsPerAnimOffset: number = 48
export const outFullscreenReqOffset: number = 52
export const outDrawAlwaysOffset: number = 53
export const outDrawOnBlurOffset: number = 54
export const outRenderModeOffset: number = 55
export const outRequestsOffset: number = 56
export const outBeepCountOffset: number = 60
export const outBeepsOffset: number = 64
export const outLayersOffset: number = 320

export const outCamXOffset: number = 8
export const outCamYOffset: number = 12

export const outReqMask: number = 1
export const outReqScreenshotShift: number = 0
export const outReqContextLossShift: number = 1
export const beepStride: number = 16
export const beepStartHzOffset: number = 0
export const beepEndHzOffset: number = 4
export const beepDurationMsOffset: number = 8
export const beepDelayMsOffset: number = 12

export const sprStride: number = 20
export const sprXYOffset: number = 0
export const sprTagCelOffset: number = 8
export const sprZOffset: number = 10
export const sprWHOffset: number = 12
export const sprFlagsOffset: number = 16

export const layerCount: number = 8
export const layerConfigStride: number = 24
export const layerConfigCamModeOffset: number = 0
export const layerConfigShaderOffset: number = 1
export const layerConfigFlagsOffset: number = 2
export const layerConfigClipXPhyOffset: number = 4
export const layerConfigClipYPhyOffset: number = 6
export const layerConfigClipWPhyOffset: number = 8
export const layerConfigClipHPhyOffset: number = 10
export const layerConfigScaleOffset: number = 12
export const layerConfigSprsPtrOffset: number = 16
export const layerConfigSprCountOffset: number = 20

export const layerFlagsDepthShift: number = 0
export const layerFlagsDepthFlag: number = 1
export const layerFlagsDepthMask: number = 1
export const layerFlagsBlendModeShift: number = 1
export const layerFlagsBlendModeMask: number = 3
export const layerCamModeApply: 0 = 0
export const layerCamModeFixed: 1 = 1
export const layerBlendModeAlpha: 0 = 0
export const layerBlendModeMultiply: 1 = 1
export const layerBlendModeReplace: 2 = 2
export const shaderTiles: 0 = 0
export const shaderSprs: 1 = 1
export const shaderOverlay: 2 = 2

export const LoopPause: 0 = 0
export const LoopLoop: 1 = 1
export const RenderModeFloat: 0 = 0
export const RenderModePixel: 1 = 1
export const FullscreenReqNone: 0 = 0
export const FullscreenReqExit: 1 = 1
export const FullscreenReqEnter: 2 = 2
export const FullscreenReqPortrait: 3 = 3
export const FullscreenReqLandscape: 4 = 4
