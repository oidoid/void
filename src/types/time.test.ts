import assert from 'node:assert/strict'
import {test} from 'node:test'
import {dateToTimestamp} from './time.ts'

test('dateToTimestamp()', () => {
  const date = new Date(2001, 0, 2, 3, 4, 5)
  assert.equal(dateToTimestamp(date), '20010102030405')
})
