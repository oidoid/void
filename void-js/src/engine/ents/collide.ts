import type {Void} from '../void.ts'

export type Collide<Ent> = (a: Ent, b: Ent, v: Void) => void
