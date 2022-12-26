import { assert, Immutable, Str } from '@/oidlib';

export type PointerType = Parameters<typeof PointerType.values['has']>[0];

export namespace PointerType {
  export const values = Immutable(new Set(['Mouse', 'Pen', 'Touch'] as const));

  export function parse(type: string): PointerType {
    const pointerType = Str.capitalize(type);
    assert(
      isPointerType(pointerType),
      `Unknown pointer type "${pointerType}".`,
    );
    return pointerType;
  }
}

function isPointerType(type: string): type is PointerType {
  return PointerType.values.has(type as PointerType);
}
