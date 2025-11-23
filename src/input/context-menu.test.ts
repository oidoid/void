import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {MenuTestEvent} from '../test/test-event.ts'
import {ContextMenu} from './context-menu.ts'

test('ContextMenu', ctx => {
  const target = new EventTarget()
  using menu = new ContextMenu(target).register('add')

  ctx.test('disabled', () => {
    let blocked = 0
    target.dispatchEvent(MenuTestEvent('contextmenu', () => blocked++))
    assert(blocked, 1)
    target.dispatchEvent(MenuTestEvent('touchstart', () => blocked++))
    assert(blocked, 2)
  })

  ctx.test('enabled', () => {
    menu.enable = true
    let blocked = 0
    target.dispatchEvent(MenuTestEvent('contextmenu', () => blocked++))
    assert(blocked, 0)
    target.dispatchEvent(MenuTestEvent('touchstart', () => blocked++))
    assert(blocked, 0)
  })
})
