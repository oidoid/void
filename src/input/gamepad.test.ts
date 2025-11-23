import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {Gamepad} from './gamepad.ts'

test('Gamepad', ctx => {
  globalThis.isSecureContext = true
  const target = new EventTarget()
  using gamepad = new Gamepad(target).register('add')
  gamepad.bitByButton[0] = 1

  ctx.test('init', () => {
    Object.assign(globalThis.navigator, {getGamepads: () => [null]})
    assert(gamepad.bits, 0)
  })

  ctx.test('no pads', () => {
    Object.assign(globalThis.navigator, {getGamepads: () => []})
    gamepad.update()
    assert(gamepad.bits, 0)
    assert(gamepad.connected, false)
  })

  ctx.test('one pad', () => {
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [], buttons: [{pressed: true}]}]
    })
    assert(gamepad.connected, true)
    gamepad.update()
    assert(gamepad.bits, 1)
  })
})
