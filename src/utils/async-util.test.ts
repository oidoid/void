import test from 'node:test'
import {assert} from '../test/assert.ts'
import type {Millis} from '../types/time.ts'
import {debounce, retry, throttle} from './async-util.ts'

test('throttle()', async () => {
  let out: number | undefined
  const fn = throttle((v: number) => {
    out = v
  }, 5 as Millis)
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

test('debounce()', async () => {
  const calls: number[] = []
  const fn = debounce((v: number) => {
    calls.push(v)
  }, 5 as Millis)

  // multiple rapid calls should coalesce to the last one.
  fn(1)
  fn(2)
  fn(3)
  await new Promise(fulfil => setTimeout(fulfil, 0))
  assert(calls, [])
  await new Promise(fulfil => setTimeout(fulfil, 5))
  assert(calls, [3])

  // a subsequent call that is canceled should not fire.
  fn(4)
  fn.cancel()
  await new Promise(fulfil => setTimeout(fulfil, 10))
  assert(calls, [3])
})

test('retry retries until success and fails after max retries', async () => {
  let attempts = 0
  const ok = await retry(
    async () => {
      attempts++
      if (attempts < 3) throw Error('fail')
      return 'ok'
    },
    5,
    1 as Millis
  )
  assert(ok, 'ok')
  assert(attempts, 3)

  attempts = 0
  await assert.rejects(() =>
    retry(
      async () => {
        attempts++
        throw Error('fail')
      },
      2,
      1 as Millis
    )
  )
  assert(attempts, 3)
})
