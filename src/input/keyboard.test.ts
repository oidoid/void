import { assertEquals } from '@std/assert'
import { Keyboard } from './keyboard.ts'
import { KeyTestEvent } from '../test/test-event.ts'

Deno.test('Keyboard', async (test) => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  kbd.bitByKey.a = 1
  kbd.bitByKey.b = 2

  await test.step('init', () => assertEquals(kbd.bits, 0))

  await test.step('a down', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'a'}))
    assertEquals(kbd.bits, 1)
  })

  await test.step('b down', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'b'}))
    assertEquals(kbd.bits, 3)
  })

  await test.step('a up', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'a'}))
    assertEquals(kbd.bits, 2)
  })
})
