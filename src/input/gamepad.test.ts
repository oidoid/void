import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Gamepad} from './gamepad.ts'

test('Gamepad', async ctx => {
  globalThis.isSecureContext = true
  const gamepad = new Gamepad()
  gamepad.bitByButton[0] = 1

  ctx.test('init', () => assert.equal(gamepad.bits, 0))

  ctx.test('no pads', () => {
    Object.assign(globalThis.navigator, {getGamepads: () => []})
    gamepad.update()
    assert.equal(gamepad.bits, 0)
  })

  ctx.test('one pad', () => {
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [], buttons: [{pressed: true}]}]
    })
    gamepad.update()
    assert.equal(gamepad.bits, 1)
  })
})
