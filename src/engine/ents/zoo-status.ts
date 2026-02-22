import type {Void} from '../void.ts'
import type {Hook, HookEnt} from './hook.ts'
import {textSetText} from './text.ts'

export type ZooStatusEnt = HookEnt<ZooStatusHook>

/** writes to text, invalid. */
export class ZooStatusHook implements Hook {
  readonly query = 'zooStatus & text'

  update(ent: ZooStatusEnt, v: Void): void {
    const ents = Object.values(v.loader.zoo).reduce(
      (sum, set) => sum + set.size,
      0
    )
    const sprites = Object.values(v.pool).reduce(
      (sum, arr) => sum + arr.size,
      0
    )
    const txt = [
      `${`${ents}`.padStart(8, ' ')} ents`,
      `${`${sprites}`.padStart(8, ' ')} sprites`
    ].join('\n')
    textSetText(ent, txt)
  }
}
