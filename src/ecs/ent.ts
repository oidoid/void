import { U32 } from '@/oidlib'

export type Ent = U32 & { [ent]: never }
declare const ent: unique symbol

export function Ent(ent: number): Ent {
  return <Ent> U32(ent)
}

export namespace Ent {
  export function parse(ent: string): Ent {
    // to-do: isEntish Ent-0
    return Ent(Number.parseInt(ent, 10))
  }
}
