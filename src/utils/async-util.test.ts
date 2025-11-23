import test from 'node:test'
import {assert} from '../test/assert.ts'
import type {Millis} from '../types/time.ts'
import {throttle} from './async-util.ts'

test('a throttled function is invoked with the latest arguments', async () => {
  let out: number | undefined
  const fn = throttle((v: number) => (out = v), 5 as Millis)
  fn(1)
  assert(out, undefined)
  await new Promise(fulfil => setTimeout(fulfil, 0))
  assert(out, 1)
  fn(2)
  await new Promise(fulfil => setTimeout(fulfil, 0))
  assert(out, 1)
  await new Promise(fulfil => setTimeout(fulfil, 5))
  assert(out, 2)
})
