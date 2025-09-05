import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Gamepad} from './gamepad.ts'

test('Gamepad', async ctx => {
  globalThis.isSecureContext = true
  const target = new EventTarget()
  using gamepad = new Gamepad(target).register('add')
  gamepad.bitByButton[0] = 1

  ctx.test('init', () => {
    Object.assign(globalThis.navigator, {getGamepads: () => [null]})
    assert.equal(gamepad.bits, 0)
    assert.equal(gamepad.invalid, false)
  })

  ctx.test('no pads', () => {
    Object.assign(globalThis.navigator, {getGamepads: () => []})
    gamepad.update()
    assert.equal(gamepad.bits, 0)
    assert.equal(gamepad.invalid, false)
    gamepad.postupdate()
  })

  ctx.test('one pad', () => {
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [], buttons: [{pressed: true}]}]
    })
    assert.equal(gamepad.invalid, true)
    gamepad.update()
    assert.equal(gamepad.bits, 1)
    assert.equal(gamepad.invalid, true)
    gamepad.postupdate()
  })
})
