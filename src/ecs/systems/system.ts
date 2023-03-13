import { Game } from '@/void'

export interface System<out PartialEnt, Ent extends PartialEnt = PartialEnt> {
  /**
   * Query of the form `[!]<key>[ <& or |><query>]`. Eg, `'a & b | !a & c'`. No
   * grouping is permitted. The empty string applies to all ents and is
   * discouraged.
   */
  readonly query: string
  run?(
    ents: ReadonlySet<Readonly<PartialEnt & Partial<Ent>>>,
    game: Game<Ent>,
  ): void
  runEnt?(ent: Readonly<PartialEnt & Partial<Ent>>, game: Game<Ent>): void
}
