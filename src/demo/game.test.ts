import test from 'node:test'
import {assert} from '../test/assert.ts'
import type {Millis} from '../types/time.ts'
import {renderDelayMillis} from './game.ts'

for (const [debugSeconds, millis, delay] of [
  [undefined, 0, 0],
  [undefined, 1, 59_999],
  [undefined, 2, 59_998],
  [undefined, 1000, 59_000],
  [undefined, 1001, 58_999],
  [undefined, 59_999, 1],
  ['true', 0, 0],
  ['true', 1, 999],
  ['true', 2, 998],
  ['true', 1000, 0],
  ['true', 1001, 999],
  ['true', 59_999, 1]
] as const)
  test(`renderDelayMillis(${debugSeconds}, ${millis})`, () => {
    const time = new Date()
    time.setSeconds(Math.trunc(millis / 1000), millis % 1000)
    assert(renderDelayMillis(time, debugSeconds), delay as Millis)
  })
