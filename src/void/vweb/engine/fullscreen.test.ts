import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {FullscreenMock} from '../test/fullscreen-mock.ts'
import {Fullscreen} from './fullscreen.ts'
import {FullscreenReqEnter, FullscreenReqLandscape} from './platform.ts'

test('Fullscreen enters without locking orientation', async () => {
  using mock = new FullscreenMock()
  const fullscreen = new Fullscreen(mock.target, mock.canvas)
  await fullscreen.enter(FullscreenReqEnter)
  assert(mock.orientationLocks, [])
})

test('Fullscreen enters and exits', async () => {
  using mock = new FullscreenMock()
  const fullscreen = new Fullscreen(mock.target, mock.canvas)
  await fullscreen.enter(FullscreenReqLandscape)
  assert(mock.orientationLocks, ['landscape'])
  await fullscreen.exit()
  assert.equal(mock.exits, 1)
  assert.equal(mock.orientationUnlocks, 1)
})
