import type {Ent} from './ent.ts'

/** map Query to a required subset of Ent. */
export type QueryEnt<Query> = Ent & ExactQueryEnt<Required<Ent>, Query>

/** map Query to a subset of Ent. */
type ExactQueryEnt<Ent, Query> = Query extends keyof Ent
  ? {[Key in Query]: Ent[Query]}
  : Query extends `!${infer Key extends keyof Ent & string}`
    ? {[K in Key]?: never}
    : Query extends `${infer Key extends keyof Ent & string} & ${infer Rest}`
      ? {[K in Key]: Ent[K & keyof Ent]} & ExactQueryEnt<Ent, Rest>
      : Query extends `!${infer Key extends keyof Ent & string} & ${infer Rest}`
        ? {[K in Key]?: never} & ExactQueryEnt<Ent, Rest>
        : Query extends `${infer Key extends keyof Ent & string} | ${infer Rest}`
          ? {[K in Key]: Ent[K & keyof Ent]} | ExactQueryEnt<Ent, Rest>
          : Query extends `!${infer Key extends keyof Ent & string} | ${infer Rest}`
            ? {[K in Key]?: never} | ExactQueryEnt<Ent, Rest>
            : never
/**
 * Query if valid, never otherwise. query is of the form
 * `[!]<key>[ <& or |><query>]`. eg, `'a & b | !a & c'`. no grouping is
 * permitted.
 */
export type EQL<Ent, Query> = Query extends `${'!' | ''}${keyof Ent & string}`
  ? Query
  : Query extends `${infer Term extends `${'!' | ''}${keyof Ent & string}`} & ${infer Rest}`
    ? `${Term} & ${EQL<Ent, Rest>}`
    : Query extends `${infer Term extends `${'!' | ''}${keyof Ent & string}`} | ${infer Rest}`
      ? `${Term} | ${EQL<Ent, Rest>}`
      : never

export function parseQuerySet<const Query>(query: EQL<Ent, Query>): string[][] {
  return query
    .split(' | ')
    .sort(compareEn)
    .map(and => and.split(' & ').sort(compareEn))
}

function compareEn(l: string, r: string): number {
  return l.localeCompare(r, 'en')
}
