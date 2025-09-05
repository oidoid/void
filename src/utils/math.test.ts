import assert from 'node:assert/strict'
import test from 'node:test'
import {clamp} from './math.ts'

test('clamp()', () => {
  assert.equal(clamp(1, 2, 3), 2)
  assert.equal(clamp(2, 2, 3), 2)
  assert.equal(clamp(3, 2, 3), 3)
  assert.equal(clamp(4, 2, 3), 3)
})
