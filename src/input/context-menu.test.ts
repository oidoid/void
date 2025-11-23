import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {MenuTestEvent} from '../test/test-event.ts'
import {ContextMenu} from './context-menu.ts'

test('ContextMenu', ctx => {
  const target = new EventTarget()
  using menu = new ContextMenu(target).register('add')

  ctx.test('disabled', () => {
    let blocked = 0
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {preventDefault: () => blocked++})
    )
    assert(blocked, 1)
    target.dispatchEvent(
      MenuTestEvent('touchstart', {preventDefault: () => blocked++})
    )
    assert(blocked, 2)
  })

  ctx.test('enabled', () => {
    menu.enable = true
    let blocked = 0
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {preventDefault: () => blocked++})
    )
    assert(blocked, 0)
    target.dispatchEvent(
      MenuTestEvent('touchstart', {preventDefault: () => blocked++})
    )
    assert(blocked, 0)
  })

  ctx.test('modified events are skipped', () => {
    menu.enable = true
    let blocked = 0
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {
        altKey: true,
        preventDefault: () => blocked++
      })
    )
    assert(blocked, 0)
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {
        metaKey: true,
        preventDefault: () => blocked++
      })
    )
    assert(blocked, 0)
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {
        ctrlKey: true,
        preventDefault: () => blocked++
      })
    )
    assert(blocked, 0)
  })

  ctx.test('untrusted events are skipped', () => {
    menu.enable = true
    let blocked = 0
    target.dispatchEvent(
      Object.assign(new Event('contextmenu'), {preventDefault: () => blocked++})
    )
    assert(blocked, 0)
  })
})
