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
