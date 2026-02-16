import {test} from 'node:test'
import {assert} from '../../test/assert.ts'
import {dateToTimestamp, type Millis, millisUntilNext} from './time.ts'

test('dateToTimestamp()', () => {
  const date = new Date(2001, 0, 2, 3, 4, 5)
  assert(dateToTimestamp(date), '20010102030405')
})

for (const [next, millis, delay] of [
  ['Min', 0, 0],
  ['Min', 1, 59_999],
  ['Min', 2, 59_998],
  ['Min', 1000, 59_000],
  ['Min', 1001, 58_999],
  ['Min', 59_999, 1],
  ['Sec', 0, 0],
  ['Sec', 1, 999],
  ['Sec', 2, 998],
  ['Sec', 1000, 0],
  ['Sec', 1001, 999],
  ['Sec', 59_999, 1]
] as const)
  test(`millisUntilNext(${millis}, ${next})`, () => {
    const time = new Date()
    time.setSeconds(Math.trunc(millis / 1000), millis % 1000)
    assert(millisUntilNext(time, next), delay as Millis)
  })
