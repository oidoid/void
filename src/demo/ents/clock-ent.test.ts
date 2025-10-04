import assert from 'node:assert/strict'
import test from 'node:test'
import {timeString} from './clock-ent.ts'

for (const [input, expected] of [
  ['00:00:00', '12:00:00'],
  ['00:00:01', '12:00:01'],
  ['00:00:59', '12:00:59'],
  ['00:01:00', '12:01:00'],
  ['00:05:00', '12:05:00'],
  ['00:59:00', '12:59:00'],
  ['01:00:00', ' 1:00:00'],
  ['12:00:00', '12:00:00'],
  ['12:01:00', '12:01:00'],
  ['13:00:00', ' 1:00:00'],
  ['23:00:00', '11:00:00'],
  ['23:59:00', '11:59:00']
] as const)
  test(`timeString(${input})`, () => {
    const date = new Date()
    const [hours, mins, secs] = input.split(':').map(Number)
    date.setHours(hours!, mins, secs, 0)
    assert.equal(timeString(date), expected)
  })
