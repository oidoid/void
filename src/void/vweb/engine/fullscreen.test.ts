import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {FullscreenMock} from '../test/fullscreen-mock.ts'
import {Fullscreen} from './fullscreen.ts'

// test('Fullscreen retries a rejected request from input', async () => {
//   using mock = new FullscreenMock()
//   mock.rejection = Error('requires user activation')
//   const fullscreen = new Fullscreen(mock.target, mock.canvas)
//   const changes: number[] = []
//   let changed!: () => void
//   const settled = new Promise<void>(resolve => (changed = resolve))
//   fullscreen.onChange = () => {
//     changes.push(mock.requests)
//     changed()
//   }
//   fullscreen.enabled = true
//   await Promise.resolve()
//   await Promise.resolve()
//   assert.equal(mock.requests, 1)
//   mock.rejection = undefined
//   fullscreen.onInput()
//   await Promise.resolve()
//   await settled
//   assert.equal(mock.requests, 2)
//   assert.equal(mock.pointerlocks, 1)
//   assert(changes, [2])
// })

test('Fullscreen exits when disabled', async () => {
  using mock = new FullscreenMock()
  const fullscreen = new Fullscreen(mock.target, mock.canvas)
  let changed!: () => void
  const entered = new Promise<void>(resolve => (changed = resolve))
  fullscreen.onChange = changed
  fullscreen.enabled = true
  await entered
  fullscreen.enabled = false
  await Promise.resolve()
  assert.equal(mock.exits, 1)
})
