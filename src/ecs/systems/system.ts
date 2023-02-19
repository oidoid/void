import { RunState } from '@/void'

export interface System<PartialEnt, Ent extends PartialEnt = PartialEnt> {
  /**
   * Where query is `[!]<key>[ <& or |><query>]`. Eg, `'a & b | !a & c'`. No
   * grouping is permitted. The empty string applies to all ents and is
   * discouraged.
   */
  readonly query: string
  run?(
    ents: ReadonlySet<Readonly<PartialEnt & Partial<Ent>>>,
    state: RunState<Partial<Ent>>,
  ): void
  runEnt?(
    ent: Readonly<PartialEnt & Partial<Ent>>,
    state: RunState<Partial<Ent>>,
  ): void
}
