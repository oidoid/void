import { assertEquals } from '@std/assert'
import { Gamepad } from './gamepad.ts'

Deno.test('Gamepad', async (test) => {
  globalThis.isSecureContext = true
  const gamepad = new Gamepad()
  gamepad.bitByButton[0] = 1

  await test.step('init', () => assertEquals(gamepad.bits, 0))

  await test.step('no pads', () => {
    Object.assign(globalThis.navigator, {getGamepads: () => []})
    gamepad.update()
    assertEquals(gamepad.bits, 0)
  })

  await test.step('one pad', () => {
    Object.assign(globalThis.navigator, {
      getGamepads: () => [{axes: [], buttons: [{pressed: true}]}]
    })
    gamepad.update()
    assertEquals(gamepad.bits, 1)
  })
})
