import {type MockTimers, mock, test} from 'node:test'
import {assert} from '../test/assert.ts'
import type {Millis} from '../types/time.ts'
import {DelayInterval} from './delay-interval.ts'

test('register()', () => {
  using timers = mockTimers()

  let calls = 0
  using interval = new DelayInterval(
    () => 5 as Millis,
    10 as Millis,
    () => calls++
  ).register('add')

  assert(calls, 0)

  timers.tick(2)
  assert(calls, 0)

  timers.tick(3)
  assert(calls, 1)

  timers.tick(4)
  assert(calls, 1)

  timers.tick(6)
  assert(calls, 2)

  timers.tick(10)
  assert(calls, 3)

  interval.register('remove')

  timers.tick(20)
  assert(calls, 3)
})

function mockTimers(): MockTimers & Disposable {
  mock.timers.enable({apis: ['setTimeout', 'setInterval']})
  return Object.assign(mock.timers, {
    [Symbol.dispose]: () => mock.timers.reset()
  })
}
