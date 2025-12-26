import * as V from '../../index.ts'

export type TallyEnt = V.SysEnt<TallySys>

/** writes to text, invalid. */
export class TallySys implements V.Sys {
  readonly query = 'tally & text'

  update(ent: TallyEnt, v: V.Void): void {
    ent.tally.updates++
    const text = [
      `${`${ent.tally.updates}`.padStart(8, ' ')} updates`,
      `${`${v.renderer.clears + 1}`.padStart(8, ' ')} renders`
    ].join('\n')
    V.textSetText(ent, text)
  }
}
