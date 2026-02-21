import * as V from '../../engine/index.ts'

export type EntCounterEnt = V.HookEnt<EntCounterHook>

/** writes to text, invalid. */
export class EntCounterHook implements V.Hook {
  readonly query = 'entCounter & text'

  update(ent: EntCounterEnt, v: V.Void): void {
    const count = v.loader.zoo.default.size
    V.textSetText(ent, `${`${count}`.padStart(8, ' ')} ents`)
  }
}
