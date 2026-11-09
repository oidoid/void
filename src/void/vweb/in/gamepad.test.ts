import {afterAll, describe, expect, test} from 'bun:test'
import {NavigatorGamepadsMock} from '../test/navigator-gamepads-mock.ts'
import {SecureContextMock} from '../test/secure-context-mock.ts'
import {Gamepad} from './gamepad.ts'

describe('Gamepad', () => {
  const secureContext = new SecureContextMock()
  secureContext.secure = true
  const nav = new NavigatorGamepadsMock()
  const target = new EventTarget()
  const gamepad = new Gamepad(target).register('add')
  afterAll(() => {
    gamepad[Symbol.dispose]()
    nav[Symbol.dispose]()
    secureContext[Symbol.dispose]()
  })

  test('init', () => {
    nav.gamepads = [null]
    expect(gamepad.polls).toStrictEqual({})
  })

  test('no pads', () => {
    nav.gamepads = []
    gamepad.update()
    expect(gamepad.polls).toStrictEqual({})
  })

  test('one pad', () => {
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
    expect(gamepad.polls).toStrictEqual({
      0: {index: 0, connected: true, mapping: 0, buttons: 1, axes: [0, 0, 0, 0]}
    })
  })

  test('update clears previous polls', () => {
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
    expect(gamepad.polls[0]?.buttons).toBe(1)

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
    expect(gamepad.polls[0]?.buttons).toBe(0)
  })

  test('axes', () => {
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
    expect(gamepad.polls[0]?.axes).toStrictEqual([0.5, -0.5, 1, 0])
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
  expect(gamepad.polls).toStrictEqual({})
})
