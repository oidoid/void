import * as V from '../../index.ts'
import type {Game} from '../game.ts'
import type {Tag} from '../types/tag.ts'

export type TallyEnt = V.QueryEnt<Tag, TallySys['query']>

/** writes to text, invalid. */
export class TallySys implements V.Sys<Tag> {
  readonly query = 'tally & text' as const

  update(ent: TallyEnt, v: Game): void {
    ent.tally.updates++
    const text = [
      `${`${ent.tally.updates}`.padStart(8, ' ')} updates`,
      `${`${v.renderer.clears + 1}`.padStart(8, ' ')} renders`
    ].join('\n')
    V.textSetText(ent, text)
  }
}
