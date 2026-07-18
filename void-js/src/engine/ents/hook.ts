export interface Hook {
  /**
   * query of the form `[!]<key>[ <& or |><query>]`. eg, `'a & b | !a & c'`. no
   * grouping is permitted.
   */
  query: string
}
