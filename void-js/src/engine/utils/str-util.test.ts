import test from 'node:test'
import {assert} from '../../test/assert.ts'
import {uncapitalize} from './str-util.ts'

for (const [input, expected] of [
  ['', ''],
  ['A', 'a'],
  ['a', 'a'],
  ['Hello', 'hello'],
  ['Σigma', 'σigma']
] as const) {
  test(`uncapitalize(${input})`, () => assert(uncapitalize(input), expected))
}
