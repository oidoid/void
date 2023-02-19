import { Str } from '@/oidlib'

/** Map query string to the subset of T specified by Query and a Partial<T>. */
export type QueryToEnt<T, Query> = Readonly<
  Partial<T> & QueryToExactEnt<T, Query>
>

/** Map query string to the subset of T specified by Query. */
type QueryToExactEnt<T, Query> = Query extends keyof T
  ? { [Key in Query]: T[Query] }
  : Query extends `!${infer Key & keyof T & string}`
    ? { [K in Key & string]: never }
  : Query extends `${infer Key & keyof T & string} & ${infer Rest}`
    ? { [K in Key & string]: T[K & keyof T] } & QueryToExactEnt<T, Rest>
  : Query extends `!${infer Key & keyof T & string} & ${infer Rest}`
    ? { [K in Key & string]: never } & QueryToExactEnt<T, Rest>
  : Query extends `${infer Key & keyof T & string} | ${infer Rest}`
    ? { [K in Key & string]: T[K & keyof T] } | QueryToExactEnt<T, Rest>
  : Query extends `!${infer Key & keyof T & string} | ${infer Rest}`
    ? { [K in Key & string]: never } | QueryToExactEnt<T, Rest>
  : never

export type UnpackedQuery<T> = readonly ReadonlySet<
  `${'!' | ''}${keyof T & string}`
>[]

export function parseUnpackedQuery<T>(query: string): UnpackedQuery<T> {
  return query.split(' | ').sort(Str.compareEn)
    .map((and) =>
      new Set(and.split(' & ').sort(Str.compareEn))
    ) as UnpackedQuery<T>
}
