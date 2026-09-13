import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {WakelockMock} from '../test/wakelock-mock.ts'
import {Wakelock} from './wakelock.ts'

test('Wakelock acquires and reacquires after browser release', async () => {
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

test('Wakelock stays unlocked when the browser rejects it', async () => {
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
