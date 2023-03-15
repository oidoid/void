import { Cel } from '@/atlas-pack'
import { Box, I16, U16 } from '@/ooz'

/** Tightly coupled to ShaderLayout and GLSL. */
export interface Bitmap extends Box<I16> {
  cel(time: number): Cel
  readonly wrapLayerByHeightLayer: U16
}
