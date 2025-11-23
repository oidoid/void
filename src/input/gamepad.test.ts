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

  ctx.test('axes thresholds', () => {
    // map axis 0 to separate bits for negative and positive thresholds.
    gamepad.bitByAxis[0] = [2, 4]

    // zero yields no bit.
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [0], buttons: []}]
    })
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 0)

    // below positive threshold yields no bit.
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [0.49], buttons: []}]
    })
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 0)

    // a positive threshold yields "more" bit.
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [0.5], buttons: []}]
    })
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 4)

    // a negative threshold yields "less" bit.
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [-0.5], buttons: []}]
    })
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 2)

    // below negative threshold magnitude yields no bit.
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [-0.49], buttons: []}]
    })
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 0)
  })

  ctx.test('insecure context ignores pads', () => {
    globalThis.isSecureContext = false
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [1], buttons: [{pressed: true}]}]
    })
    gamepad.reset()
    gamepad.update()
    assert(gamepad.bits, 0)
    assert(gamepad.connected, false)
    globalThis.isSecureContext = true
  })
})
