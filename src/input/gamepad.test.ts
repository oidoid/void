import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {NavigatorGamepadsMock} from '../test/navigator-gamepads-mock.ts'
import {SecureContextMock} from '../test/secure-context-mock.ts'
import {Gamepad} from './gamepad.ts'

test('Gamepad', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = true
  using navigator = new NavigatorGamepadsMock()
  const target = new EventTarget()
  using gamepad = new Gamepad(target).register('add')
  gamepad.bitByButton[0] = 1

  await ctx.test('init', () => {
    navigator.gamepads = [null]
    assert(gamepad.bits, 0)
  })

  await ctx.test('no pads', () => {
    navigator.gamepads = []
    gamepad.update()
    assert(gamepad.bits, 0)
    assert(gamepad.connected, false)
  })

  await ctx.test('one pad', () => {
    navigator.gamepads = [
      {axes: [], buttons: [{pressed: true}]} as unknown as globalThis.Gamepad
    ]
    assert(gamepad.connected, true)
    gamepad.update()
    assert(gamepad.bits, 1)
  })

  await ctx.test('update clears previous bits', () => {
    // first update sets a bit.
    navigator.gamepads = [
      {axes: [], buttons: [{pressed: true}]} as unknown as globalThis.Gamepad
    ]
    gamepad.update()
    assert(gamepad.bits, 1)

    // second update with no buttons clears the bit.
    navigator.gamepads = [
      {axes: [], buttons: [{pressed: false}]} as unknown as globalThis.Gamepad
    ]
    gamepad.update()
    assert(gamepad.bits, 0)
  })

  await ctx.test('axes thresholds', () => {
    // map axis 0 to separate bits for negative and positive thresholds.
    gamepad.bitByAxis[0] = [2, 4]

    // zero yields no bit.
    navigator.gamepads = [
      {axes: [0], buttons: []} as unknown as globalThis.Gamepad
    ]
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 0)

    // below positive threshold yields no bit.
    navigator.gamepads = [
      {axes: [0.49], buttons: []} as unknown as globalThis.Gamepad
    ]
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 0)

    // a positive threshold yields "more" bit.
    navigator.gamepads = [
      {axes: [0.5], buttons: []} as unknown as globalThis.Gamepad
    ]
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 4)

    // a negative threshold yields "less" bit.
    navigator.gamepads = [
      {axes: [-0.5], buttons: []} as unknown as globalThis.Gamepad
    ]
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 2)

    // below negative threshold magnitude yields no bit.
    navigator.gamepads = [
      {axes: [-0.49], buttons: []} as unknown as globalThis.Gamepad
    ]
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 0)
  })
})

test('insecure context ignores pads', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false

  using navigator = new NavigatorGamepadsMock()
  const target = new EventTarget()
  using gamepad = new Gamepad(target).register('add')
  gamepad.bitByButton[0] = 1

  navigator.gamepads = [
    {axes: [1], buttons: [{pressed: true}]} as unknown as globalThis.Gamepad
  ]
  gamepad.reset()
  gamepad.update()
  assert(gamepad.bits, 0)
  assert(gamepad.connected, false)
})
