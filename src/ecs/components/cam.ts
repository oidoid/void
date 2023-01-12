import { I16, I16XY, NumberXY, U16XY } from '@/oidlib';

export interface Cam {
  readonly clientViewportWH: NumberXY;
  readonly nativeViewportWH: U16XY;
  readonly minViewport: U16XY;
  scale: I16;
  readonly xy: I16XY;
  readonly wh: I16XY;
}
