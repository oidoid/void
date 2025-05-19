import { assertEquals } from '@std/assert'
import { ContextMenu } from './context-menu.ts'

Deno.test('ContextMenu', async (test) => {
  const target = new EventTarget()
  using menu = new ContextMenu(target).register('add')

  await test.step('disabled', () => {
    let blocked = 0
    target.dispatchEvent(MenuEvent('contextmenu', () => blocked++))
    assertEquals(blocked, 1)
    target.dispatchEvent(MenuEvent('touchstart', () => blocked++))
    assertEquals(blocked, 2)
  })

  await test.step('enabled', () => {
    menu.enable = true
    let blocked = 0
    target.dispatchEvent(MenuEvent('contextmenu', () => blocked++))
    assertEquals(blocked, 0)
    target.dispatchEvent(MenuEvent('touchstart', () => blocked++))
    assertEquals(blocked, 0)
  })
})

function MenuEvent(type: string, preventDefault: () => void): Event {
  return Object.assign(new Event(type), {preventDefault})
}
