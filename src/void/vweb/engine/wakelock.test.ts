import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {WakelockMock} from '../test/wakelock-mock.ts'
import {Wakelock} from './wakelock.ts'

test('Wakelock reports acquisition, release, and reacquisition', async () => {
  using mock = new WakelockMock()
  const wakelock = new Wakelock()
  const locked: boolean[] = []
  wakelock.onChange = () => locked.push(wakelock.locked)
  wakelock.enabled = true
  await Promise.resolve()
  assert.equal(wakelock.locked, true)
  mock.sentinel?.dispatchEvent(new Event('release'))
  assert.equal(mock.requests, 2)
  await Promise.resolve()
  assert.equal(wakelock.locked, true)
  assert(locked, [true, false, true])
})

test('Wakelock stays unlocked when the browser rejects it', async () => {
  using mock = new WakelockMock()
  mock.rejection = Error('rejected')
  const wakelock = new Wakelock()
  wakelock.enabled = true
  await Promise.resolve()
  assert.equal(mock.requests, 1)
  assert.equal(wakelock.locked, false)
  wakelock.enabled = true
  await Promise.resolve()
  assert.equal(mock.requests, 2)
})

test('Wakelock releases before onChange can reacquire', async () => {
  using mock = new WakelockMock()
  const wakelock = new Wakelock()
  wakelock.enabled = true
  await Promise.resolve()
  wakelock.onChange = () => {
    if (wakelock.locked) return
    assert.equal(mock.releases, 1)
    wakelock.enabled = true
  }
  wakelock.enabled = false
  await Promise.resolve()
  assert.equal(mock.requests, 2)
  assert.equal(wakelock.locked, true)
})
