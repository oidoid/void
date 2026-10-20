import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {WakelockMock} from '../test/wakelock-mock.ts'
import {Wakelock} from './wakelock.ts'

test('wakelock acquires and reacquires after browser release', async () => {
  using mock = new WakelockMock()
  const wakelock = new Wakelock()
  wakelock.update()
  await Promise.resolve()
  assert.equal(wakelock.locked, true)
  mock.sentinel?.dispatchEvent(new Event('release'))
  assert.equal(mock.reqs, 2)
  await Promise.resolve()
  assert.equal(wakelock.locked, true)
})

test('wakelock stays unlocked when the browser rejects it', async () => {
  using mock = new WakelockMock()
  mock.rejection = Error('rejected')
  const wakelock = new Wakelock()
  wakelock.update()
  await Promise.resolve()
  assert.equal(mock.reqs, 1)
  assert.equal(wakelock.locked, false)
  wakelock.update()
  await Promise.resolve()
  assert.equal(mock.reqs, 2)
})

test('wakelock follows document focus', async () => {
  using mock = new WakelockMock()
  mock.focused = false
  const wakelock = new Wakelock()
  wakelock.update()
  await Promise.resolve()
  assert.equal(mock.reqs, 0)
  assert.equal(wakelock.locked, false)

  mock.focused = true
  wakelock.update()
  await Promise.resolve()
  assert.equal(wakelock.locked, true)

  mock.focused = false
  wakelock.update()
  assert.equal(mock.releases, 1)
  assert.equal(wakelock.locked, false)

  mock.focused = true
  wakelock.update()
  await Promise.resolve()
  assert.equal(mock.reqs, 2)
  assert.equal(wakelock.locked, true)
})

test('wakelock releases a pending acquisition after focus loss', async () => {
  using mock = new WakelockMock()
  const wakelock = new Wakelock()
  wakelock.update()
  mock.focused = false
  wakelock.update()
  await Promise.resolve()
  assert.equal(mock.reqs, 1)
  assert.equal(mock.releases, 1)
  assert.equal(wakelock.locked, false)
})

test('wakelock stays unlocked after browser release without focus', async () => {
  using mock = new WakelockMock()
  const wakelock = new Wakelock()
  wakelock.update()
  await Promise.resolve()
  mock.focused = false
  mock.sentinel?.dispatchEvent(new Event('release'))
  await Promise.resolve()
  assert.equal(mock.reqs, 1)
  assert.equal(wakelock.locked, false)
})
