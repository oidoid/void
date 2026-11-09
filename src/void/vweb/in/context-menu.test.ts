import {afterAll, describe, expect, test} from 'bun:test'
import {TestEventTarget} from '../test/test-event-target.ts'
import {MenuTestEvent} from '../test/test-event.ts'
import {ContextMenu} from './context-menu.ts'

describe('ContextMenu', () => {
  const target = new TestEventTarget()
  const menu = new ContextMenu(target).register('add')
  afterAll(() => menu[Symbol.dispose]())

  test('disabled', () => {
    let blocked = 0
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {preventDefault: () => blocked++})
    )
    expect(blocked).toBe(1)
    target.dispatchEvent(
      MenuTestEvent('touchstart', {preventDefault: () => blocked++})
    )
    expect(blocked).toBe(2)
  })

  test('enabled', () => {
    menu.enable = true
    let blocked = 0
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {preventDefault: () => blocked++})
    )
    expect(blocked).toBe(0)
    target.dispatchEvent(
      MenuTestEvent('touchstart', {preventDefault: () => blocked++})
    )
    expect(blocked).toBe(0)
  })

  test('modified events are skipped', () => {
    menu.enable = true
    let blocked = 0
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {
        altKey: true,
        preventDefault: () => blocked++
      })
    )
    expect(blocked).toBe(0)
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {
        metaKey: true,
        preventDefault: () => blocked++
      })
    )
    expect(blocked).toBe(0)
    target.dispatchEvent(
      MenuTestEvent('contextmenu', {
        ctrlKey: true,
        preventDefault: () => blocked++
      })
    )
    expect(blocked).toBe(0)
  })

  test('untrusted events are skipped', () => {
    menu.enable = true
    let blocked = 0
    target.dispatchEvent(
      Object.assign(new Event('contextmenu'), {
        preventDefault: () => blocked++
      })
    )
    expect(blocked).toBe(0)
  })
})
