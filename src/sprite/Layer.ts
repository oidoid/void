import { Immutable, Inverse, U16, U8 } from '@/oidlib';

export const Layer = Immutable({
  Top: U8(0x01), // so that shader substraction keeps layer >= 0
  Cursor: U8(0x01),
  Bottom: U8(0x40), // Hidden
}) satisfies { [name: string]: U8 };
export type Layer = keyof typeof Layer;

export const LayerInverse = Immutable(Inverse(Layer));

export const WrapMask: U16 = U16(0b1111_1111_0000_0000);
export const LayerMask: U16 = U16(0b0000_0000_0111_1111);
export const ExcludeHeightShift: number = 7;
export const ExcludeHeightFlag: U16 = U16(0b1000_0000);
export const ExcludeHeightMask: U16 = U16(ExcludeHeightFlag);
