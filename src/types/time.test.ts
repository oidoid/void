import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {dateToTimestamp} from './time.ts'

test('dateToTimestamp()', () => {
  const date = new Date(2001, 0, 2, 3, 4, 5)
  assert(dateToTimestamp(date), '20010102030405')
})
