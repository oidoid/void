import {expect, test} from 'bun:test'
import {FullscreenMock} from '../test/fullscreen-mock.ts'
import {WindowModeFullscreen, WindowModeFullscreenLandscape} from './bridge.ts'
import {Fullscreen} from './fullscreen.ts'

test('Fullscreen enters without locking orientation', async () => {
  using mock = new FullscreenMock()
  const fullscreen = new Fullscreen(mock.target, mock.canvas)
  await fullscreen.enter(WindowModeFullscreen)
  expect(mock.orientationLocks).toStrictEqual([])
})

test('Fullscreen enters and exits', async () => {
  using mock = new FullscreenMock()
  const fullscreen = new Fullscreen(mock.target, mock.canvas)
  await fullscreen.enter(WindowModeFullscreenLandscape)
  expect(mock.orientationLocks).toStrictEqual(['landscape'])
  await fullscreen.exit()
  expect(mock.exits).toBe(1)
  expect(mock.orientationUnlocks).toBe(1)
})
