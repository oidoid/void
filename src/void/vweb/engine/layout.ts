export const spriteAnimCelOffset: number = 8
export const spriteZOffset: number = 10
export const spriteWHOffset: number = 12
export const spriteStride: number = 20
export const layerCount: number = 8

export const layerConfigRenderModeOffset: number = 0
export const layerConfigCamModeOffset: number = 1
export const layerConfigShaderOffset: number = 2
export const layerConfigFlagsOffset: number = 3
export const layerFlagsNoDepthShift = 0 as const
export const layerFlagsNoDepthFlag = 1 as const
export const layerFlagsNoDepthMask = layerFlagsNoDepthFlag
export const layerConfigClipXPhyOffset: number = 4
export const layerConfigClipYPhyOffset: number = 6
export const layerConfigClipWPhyOffset: number = 8
export const layerConfigClipHPhyOffset: number = 10
export const layerConfigScaleOffset: number = 12
export const layerConfigModuloOffset: number = 16
export const layerConfigSpritesPtrOffset: number = 20
export const layerConfigSpriteCountOffset: number = 24
export const layerConfigStride: number = 28

export const layerRenderModeInt = 0 as const
export const layerRenderModeFloat = 1 as const
export type LayerRenderMode =
  | typeof layerRenderModeFloat
  | typeof layerRenderModeInt

export const layerCamModeApply = 0 as const
export const layerCamModeFixed = 1 as const
export type LayerCamMode = typeof layerCamModeApply | typeof layerCamModeFixed

export const shaderTiles = 0 as const
export const shaderSprites = 1 as const
export type Shader = typeof shaderTiles | typeof shaderSprites

export type LayerConfig = {
  renderMode: LayerRenderMode
  clipPhy: {x: number; y: number; w: number; h: number}
  camMode: LayerCamMode
  scale: number
  modulo: number
  shader: Shader
  flags: number
  spritesPtr: number
  spriteCount: number
}
