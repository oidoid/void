import * as V from '../../engine/index.ts'

export type TallyEnt = V.HookEnt<TallyHook>

/** writes to text, invalid. */
export class TallyHook implements V.Hook {
  readonly query = 'tally & text'

  update(ent: TallyEnt, v: V.Void): void {
    ent.tally.updates++
    const text = [
      `${`${ent.tally.updates}`.padStart(8, ' ')}U`,
      `${`${v.renderer.clears + 1}`.padStart(8, ' ')}D`
    ].join('\n')
    V.textSetText(ent, text)
  }
}
