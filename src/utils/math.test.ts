import test from 'node:test'
import {assert} from '../test/assert.ts'
import {clamp} from './math.ts'

test('clamp()', () => {
  assert(clamp(1, 2, 3), 2)
  assert(clamp(2, 2, 3), 2)
  assert(clamp(3, 2, 3), 3)
  assert(clamp(4, 2, 3), 3)
})
