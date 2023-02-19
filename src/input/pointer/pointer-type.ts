import { Immutable, Str } from '@/ooz'

export type PointerType = Parameters<typeof PointerType.values['has']>[0]

export namespace PointerType {
  export const values = Immutable(new Set(['Mouse', 'Pen', 'Touch'] as const))

  export function parse(type: string): PointerType | undefined {
    const pointerType = Str.capitalize(type)
    return isPointerType(pointerType) ? pointerType : undefined
  }
}

function isPointerType(type: string): type is PointerType {
  return PointerType.values.has(type as PointerType)
}
