import {expect, test} from 'bun:test'
import {capitalize, uncapitalize} from './str-util.ts'

test.each([
  ['', ''],
  ['a', 'A'],
  ['A', 'A'],
  ['hello', 'Hello'],
  ['hELLO', 'HELLO'],
  ['σigma', 'Σigma'],
  ['ßeta', 'SSeta'],
  ['1hello', '1hello'],
  ['🎮game', '🎮game']
] as const)('capitalize(%s)', (input, expected) =>
  expect(capitalize(input)).toBe(expected)
)

test.each([
  ['', ''],
  ['A', 'a'],
  ['a', 'a'],
  ['Hello', 'hello'],
  ['HELLO', 'hELLO'],
  ['Σigma', 'σigma'],
  ['1Hello', '1Hello'],
  ['🎮Game', '🎮Game']
] as const)('uncapitalize(%s)', (input, expected) =>
  expect(uncapitalize(input)).toBe(expected)
)
