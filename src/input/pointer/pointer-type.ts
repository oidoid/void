import { capitalize } from '@/ooz'

export type PointerType = Parameters<typeof PointerTypeSet['has']>[0]
export const PointerTypeSet = new Set(['Mouse', 'Pen', 'Touch'] as const)

export function parsePointerType(type: string): PointerType | undefined {
  const pointerType = capitalize(type)
  return isPointerType(pointerType) ? pointerType : undefined
}

function isPointerType(type: string): type is PointerType {
  return PointerTypeSet.has(type as PointerType)
}
