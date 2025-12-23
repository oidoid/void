import test from 'node:test'
import {assert} from '../test/assert.ts'
import type {Millis} from '../types/time.ts'
import {DelayInterval} from './delay-interval.ts'

test('register()', async () => {
  let calls = 0
  using interval = new DelayInterval(
    () => 5 as Millis,
    10 as Millis,
    () => calls++
  ).register('add')

  assert(calls, 0)

  await new Promise(fulfil => setTimeout(fulfil, 2))
  assert(calls, 0)
  await new Promise(fulfil => setTimeout(fulfil, 3))

  assert(calls, 1)

  await new Promise(fulfil => setTimeout(fulfil, 4))
  assert(calls, 1)
  await new Promise(fulfil => setTimeout(fulfil, 6))

  assert(calls, 2)

  await new Promise(fulfil => setTimeout(fulfil, 10))
  assert(calls, 3)

  interval.register('remove')

  await new Promise(fulfil => setTimeout(fulfil, 20))
  assert(calls, 3)
})
