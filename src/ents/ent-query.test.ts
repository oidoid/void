import {describe, test} from 'node:test'
import {assert} from '../test/assert.ts'
import type {Box, XY} from '../types/geo.ts'
import type {Ent} from './ent.ts'
import {type EQL, parseQuerySet, type QueryEnt} from './ent-query.ts'

declare module './ent.ts' {
  interface Ent {
    bags?: number
    boxes?: Box[]
    items?: string[]
    wh?: XY
    xy?: XY
  }
}

describe('parseQuerySet()', () => {
  const cases: [query: string, querySet: string[][]][] = [
    ['name', [['name']]],
    ['name & xy', [['name', 'xy']]],
    ['wh & items', [['items', 'wh']]],
    ['name & xy | bags', [['bags'], ['name', 'xy']]],
    ['name & !xy | bags', [['bags'], ['!xy', 'name']]]
  ]
  for (const [i, [query, querySet]] of cases.entries()) {
    test(`parse query ${i}: ${query}`, () => {
      assert(parseQuerySet(query as EQL<Ent, ''>), querySet)
    })
  }
})

describe('QueryEnt', () => {
  const testSingular: QueryEnt<'boxes'> = {boxes: [{x: 1, y: 2, w: 3, h: 4}]}
  testSingular.boxes.length
  try {
    // @ts-expect-error
    testSingular.xy.x
  } catch {}

  // @ts-expect-error
  const _testTypo: QueryEnt<'boxes2'> = {boxes: [{x: 1, y: 2, w: 3, h: 4}]}

  // @ts-expect-error
  const _testInvert: QueryEnt<'!xy'> = {boxes: [{x: 1, y: 2, w: 3, h: 4}]}

  const testConjunctionInvertPresent: QueryEnt<'boxes & !xy'> = {
    boxes: [{x: 1, y: 2, w: 3, h: 4}],
    // @ts-expect-error
    xy: {x: 1, y: 2}
  }
  testConjunctionInvertPresent.boxes.length
  try {
    // @ts-expect-error
    testSingular.xy.x
  } catch {}

  const testConjunctionInvertMissing: QueryEnt<'boxes & !xy'> = {
    boxes: [{x: 1, y: 2, w: 3, h: 4}]
  }
  testConjunctionInvertMissing.boxes.length
  try {
    // @ts-expect-error
    testSingular.xy.x
  } catch {}

  const testConjunction: QueryEnt<'boxes & xy'> = {
    boxes: [{x: 1, y: 2, w: 3, h: 4}],
    xy: {x: 1, y: 2}
  }
  testConjunction.boxes.length
  testConjunction.xy.x

  const testUnion: QueryEnt<'boxes | xy'> = {
    boxes: [{x: 1, y: 2, w: 3, h: 4}],
    xy: {x: 1, y: 2}
  }
  testUnion.boxes?.length
  testUnion.xy?.x
})
