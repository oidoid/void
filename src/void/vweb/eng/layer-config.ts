import type {
  layerBlendModeAlpha,
  layerBlendModeMultiply,
  layerBlendModeReplace,
  layerCamModeApply,
  layerCamModeFixed,
  shaderOverlay,
  shaderSprs,
  shaderTiles
} from './bridge.ts'

export type LayerCamMode = typeof layerCamModeApply | typeof layerCamModeFixed
export type LayerBlendMode =
  | typeof layerBlendModeAlpha
  | typeof layerBlendModeMultiply
  | typeof layerBlendModeReplace
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
