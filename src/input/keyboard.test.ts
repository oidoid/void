import { assertEquals } from '@std/assert'
import { Keyboard } from './keyboard.ts'

Deno.test('Keyboard', async (test) => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  kbd.bitByKey.a = 1
  kbd.bitByKey.b = 2

  await test.step('init', () => assertEquals(kbd.bits, 0))

  await test.step('a down', () => {
    target.dispatchEvent(KeyEvent('keydown', {key: 'a'}))
    assertEquals(kbd.bits, 1)
  })

  await test.step('b down', () => {
    target.dispatchEvent(KeyEvent('keydown', {key: 'b'}))
    assertEquals(kbd.bits, 3)
  })

  await test.step('a up', () => {
    target.dispatchEvent(KeyEvent('keyup', {key: 'a'}))
    assertEquals(kbd.bits, 2)
  })
})

function KeyEvent(type: string, init: Partial<KeyboardEvent>): Event {
  return Object.assign(new Event(type), init)
}
