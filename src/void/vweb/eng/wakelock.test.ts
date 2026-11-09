import {expect, test} from 'bun:test'
import {WakelockMock} from '../test/wakelock-mock.ts'
import {Wakelock} from './wakelock.ts'

test('wakelock acquires and reacquires after browser release', async () => {
  using mock = new WakelockMock()
  const wakelock = new Wakelock()
  wakelock.update()
  await Promise.resolve()
  expect(wakelock.locked).toBe(true)
  mock.sentinel?.dispatchEvent(new Event('release'))
  expect(mock.reqs).toBe(2)
  await Promise.resolve()
  expect(wakelock.locked).toBe(true)
})

test('wakelock stays unlocked when the browser rejects it', async () => {
  using mock = new WakelockMock()
  mock.rejection = Error('rejected')
  const wakelock = new Wakelock()
  wakelock.update()
  await Promise.resolve()
  expect(mock.reqs).toBe(1)
  expect(wakelock.locked).toBe(false)
  wakelock.update()
  await Promise.resolve()
  expect(mock.reqs).toBe(2)
})

test('wakelock follows document focus', async () => {
  using mock = new WakelockMock()
  mock.focused = false
  const wakelock = new Wakelock()
  wakelock.update()
  await Promise.resolve()
  expect(mock.reqs).toBe(0)
  expect(wakelock.locked).toBe(false)

  mock.focused = true
  wakelock.update()
  await Promise.resolve()
  expect(wakelock.locked).toBe(true)

  mock.focused = false
  wakelock.update()
  expect(mock.releases).toBe(1)
  expect(wakelock.locked).toBe(false)

  mock.focused = true
  wakelock.update()
  await Promise.resolve()
  expect(mock.reqs).toBe(2)
  expect(wakelock.locked).toBe(true)
})

test('wakelock releases a pending acquisition after focus loss', async () => {
  using mock = new WakelockMock()
  const wakelock = new Wakelock()
  wakelock.update()
  mock.focused = false
  wakelock.update()
  await Promise.resolve()
  expect(mock.reqs).toBe(1)
  expect(mock.releases).toBe(1)
  expect(wakelock.locked).toBe(false)
})

test('wakelock stays unlocked after browser release without focus', async () => {
  using mock = new WakelockMock()
  const wakelock = new Wakelock()
  wakelock.update()
  await Promise.resolve()
  mock.focused = false
  mock.sentinel?.dispatchEvent(new Event('release'))
  await Promise.resolve()
  expect(mock.reqs).toBe(1)
  expect(wakelock.locked).toBe(false)
})
