import { Pointer } from './pointer.ts'
import { assertEquals } from '@std/assert'
import { PointerTestEvent } from '../test/test-event.ts'

Deno.test('Pointer', async (test) => {
  const target = new EventTarget()
  using pointer = new Pointer(target).register('add')
  pointer.bitByButton[1] = 1
  pointer.bitByButton[2] = 2

  await test.step('init', () => {
    assertEquals(pointer.primary, undefined)
    assertEquals(pointer.secondary, [])
    assertEquals(pointer.clientCenter, undefined)
  })

  await test.step('primary down', () => {
    const ev = PointerTestEvent('pointerdown', {
      buttons: 1,
      offsetX: 10,
      offsetY: 40,
      isPrimary: true
    })
    target.dispatchEvent(ev)
    assertEquals(pointer.bits, 1)
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.clientXY, {x: 10, y: 40})
    assertEquals(pointer.secondary, [])
    assertEquals(pointer.clientCenter, {x: 10, y: 40})
  })

  await test.step('secondary down', () => {
    const ev = PointerTestEvent('pointerdown', {
      buttons: 2,
      offsetX: 11,
      offsetY: 41,
      isPrimary: false
    })
    target.dispatchEvent(ev)
    assertEquals(pointer.bits, 3)
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.clientXY, {x: 10, y: 40})
    assertEquals(pointer.secondary[0]?.bits, 2)
    assertEquals(pointer.secondary[0]?.clientXY, {x: 11, y: 41})
    assertEquals(pointer.clientCenter, {x: 10.5, y: 40.5})
  })

  await test.step('primary up', () => {
    const ev = PointerTestEvent('pointerup', {
      buttons: 0,
      offsetX: 11,
      offsetY: 41,
      isPrimary: true
    })
    target.dispatchEvent(ev)
    assertEquals(pointer.bits, 2)
    assertEquals(pointer.primary?.bits, 0)
    assertEquals(pointer.primary?.clientXY, {x: 11, y: 41})
    assertEquals(pointer.secondary[0]?.bits, 2)
    assertEquals(pointer.secondary[0]?.clientXY, {x: 11, y: 41})
    assertEquals(pointer.clientCenter, {x: 11, y: 41})
  })
})
