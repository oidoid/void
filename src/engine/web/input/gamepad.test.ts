import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {NavigatorGamepadsMock} from '../test/navigator-gamepads-mock.ts'
import {SecureContextMock} from '../test/secure-context-mock.ts'
import {Gamepad} from './gamepad.ts'

test('Gamepad', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = true
  using nav = new NavigatorGamepadsMock()
  const target = new EventTarget()
  using gamepad = new Gamepad(target).register('add')

  await ctx.test('init', () => {
    nav.gamepads = [null]
    assert(gamepad.polls, {})
  })

  await ctx.test('no pads', () => {
    nav.gamepads = []
    gamepad.update()
    assert(gamepad.polls, {})
  })

  await ctx.test('one pad', () => {
    nav.gamepads = [
      {
        index: 0,
        connected: true,
        mapping: 'standard',
        axes: [0, 0, 0, 0],
        buttons: [{pressed: true}, {pressed: false}]
      } as unknown as globalThis.Gamepad
    ]
    gamepad.update()
    assert(gamepad.polls, {
      0: {index: 0, connected: true, mapping: 0, buttons: 1, axes: [0, 0, 0, 0]}
    })
  })

  await ctx.test('update clears previous polls', () => {
    nav.gamepads = [
      {
        index: 0,
        connected: true,
        mapping: '',
        axes: [],
        buttons: [{pressed: true}]
      } as unknown as globalThis.Gamepad
    ]
    gamepad.update()
    assert(gamepad.polls[0]?.buttons, 1)

    nav.gamepads = [
      {
        index: 0,
        connected: true,
        mapping: '',
        axes: [],
        buttons: [{pressed: false}]
      } as unknown as globalThis.Gamepad
    ]
    gamepad.update()
    assert(gamepad.polls[0]?.buttons, 0)
  })

  await ctx.test('axes', () => {
    nav.gamepads = [
      {
        index: 0,
        connected: true,
        mapping: '',
        axes: [0.5, -0.5, 1, 0],
        buttons: []
      } as unknown as globalThis.Gamepad
    ]
    gamepad.update()
    assert(gamepad.polls[0]?.axes, [0.5, -0.5, 1, 0])
  })
})

test('insecure context ignores pads', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false

  using nav = new NavigatorGamepadsMock()
  const target = new EventTarget()
  using gamepad = new Gamepad(target).register('add')

  nav.gamepads = [
    {
      index: 0,
      connected: true,
      mapping: '',
      axes: [],
      buttons: [{pressed: true}]
    } as unknown as globalThis.Gamepad
  ]
  gamepad.update()
  assert(gamepad.polls, {})
})
