import { Game } from '@/void'
import { SpriteEnt } from '../sprite-ent.ts'

export interface System<
  out PartialEnt,
  Ent extends PartialEnt & SpriteEnt = PartialEnt & SpriteEnt,
> {
  /**
   * Query of the form `[!]<key>[ <& or |><query>]`. Eg, `'a & b | !a & c'`. No
   * grouping is permitted.
   */
  readonly query: string
  run?(
    ents: ReadonlySet<Readonly<PartialEnt & Partial<Ent>>>,
    game: Game<Ent>,
  ): void
  runEnt?(ent: Readonly<PartialEnt & Partial<Ent>>, game: Game<Ent>): void
}
