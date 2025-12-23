import test from 'node:test'
import {assert} from '../test/assert.ts'
import type {XY} from '../types/geo.ts'
import {parseQuerySet} from './ent-query.ts'

for (const [index, [queryStr, query]] of (
  [
    ['name', [new Set(['name'] as const)]],
    ['name & xy', [new Set(['name', 'xy'] as const)]],
    ['wh & items', [new Set(['items', 'wh'] as const)]],
    [
      'name & xy | bags',
      [new Set(['bags' as const]), new Set(['name', 'xy'] as const)]
    ],
    [
      'name & !xy | bags',
      [new Set(['bags' as const]), new Set(['name', '!xy'] as const)]
    ]
  ] as const
).entries()) {
  test(`parse query: ${index}.`, () => {
    type Ent = {name: string; xy: XY; bags: number; wh: XY; items: string[]}
    assert(parseQuerySet<Ent>(queryStr), query)
  })
}
