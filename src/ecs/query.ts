import { compareEn } from '@/ooz'

/** Map Query to a subset of Ent and a Partial<T>. */
export type QueryEnt<Ent, Query> = Readonly<
  Partial<Ent> & ExactQueryEnt<Ent, Query>
>

/** Map Query to a subset of Ent. */
type ExactQueryEnt<Ent, Query> = Query extends keyof Ent
  ? { [Key in Query]: Ent[Query] }
  : Query extends `!${infer Key extends keyof Ent & string}`
    ? { [K in Key]: never }
  : Query extends `${infer Key extends keyof Ent & string} & ${infer Rest}`
    ? { [K in Key]: Ent[K & keyof Ent] } & ExactQueryEnt<Ent, Rest>
  : Query extends `!${infer Key extends keyof Ent & string} & ${infer Rest}`
    ? { [K in Key]: never } & ExactQueryEnt<Ent, Rest>
  : Query extends `${infer Key extends keyof Ent & string} | ${infer Rest}`
    ? { [K in Key]: Ent[K & keyof Ent] } | ExactQueryEnt<Ent, Rest>
  : Query extends `!${infer Key extends keyof Ent & string} | ${infer Rest}`
    ? { [K in Key]: never } | ExactQueryEnt<Ent, Rest>
  : never

/** Returns Query if valid, never otherwise. */
export type EQL<Ent, Query> = Query extends `${'!' | ''}${
  & keyof Ent
  & string}` ? Query
  : Query extends
    `${infer Term extends `${'!' | ''}${keyof Ent & string}`} & ${infer Rest}`
    ? `${Term} & ${EQL<Ent, Rest>}`
  : Query extends
    `${infer Term extends `${'!' | ''}${keyof Ent & string}`} | ${infer Rest}`
    ? `${Term} | ${EQL<Ent, Rest>}`
  : never

export type QuerySet<T> = readonly ReadonlySet<
  `${'!' | ''}${keyof T & string}`
>[]

export function parseQuerySet<Ent>(query: string): QuerySet<Ent> {
  return query.split(' | ').sort(compareEn)
    .map((and) => new Set(and.split(' & ').sort(compareEn))) as QuerySet<Ent>
}
