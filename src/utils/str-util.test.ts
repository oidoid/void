import assert from 'node:assert/strict'
import test from 'node:test'
import {uncapitalize} from './str-util.ts'

for (const [input, expected] of [
  ['', ''],
  ['A', 'a'],
  ['a', 'a'],
  ['Hello', 'hello'],
  ['Σigma', 'σigma']
] as const) {
  test(`uncapitalize(${input})`, () =>
    assert.equal(uncapitalize(input), expected))
}
