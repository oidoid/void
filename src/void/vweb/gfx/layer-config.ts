import type {
  layerBlendModeAlpha,
  layerBlendModeMultiply,
  layerBlendModeReplace,
  layerCamModeApply,
  layerCamModeFixed,
  shaderSprs,
  shaderTiles
} from '../eng/bridge.ts'

export type LayerCamMode = typeof layerCamModeApply | typeof layerCamModeFixed
export type LayerBlendMode =
  | typeof layerBlendModeAlpha
  | typeof layerBlendModeMultiply
  | typeof layerBlendModeReplace
export type Shader = typeof shaderTiles | typeof shaderSprs

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
