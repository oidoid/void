import { I16, I16Box, NumXY, U16XY } from '@/ooz'

export interface Cam {
  readonly clientViewportWH: NumXY
  readonly nativeViewportWH: U16XY
  readonly minViewport: U16XY
  scale: I16
  readonly viewport: I16Box
}
