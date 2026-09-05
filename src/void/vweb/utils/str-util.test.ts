import test from 'node:test'
import {assert} from '../test/assert.ts'
import {capitalize, uncapitalize} from './str-util.ts'

for (const [input, expected] of [
  ['', ''],
  ['a', 'A'],
  ['A', 'A'],
  ['hello', 'Hello'],
  ['hELLO', 'HELLO'],
  ['σigma', 'Σigma'],
  ['ßeta', 'SSeta'],
  ['1hello', '1hello'],
  ['🎮game', '🎮game']
] as const) {
  test(`capitalize(${input})`, () => assert(capitalize(input), expected))
}

for (const [input, expected] of [
  ['', ''],
  ['A', 'a'],
  ['a', 'a'],
  ['Hello', 'hello'],
  ['HELLO', 'hELLO'],
  ['Σigma', 'σigma'],
  ['1Hello', '1Hello'],
  ['🎮Game', '🎮Game']
] as const) {
  test(`uncapitalize(${input})`, () => assert(uncapitalize(input), expected))
}
