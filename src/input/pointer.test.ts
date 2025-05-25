import { Pointer } from './pointer.ts'
import { assertEquals } from '@std/assert'
import { PointerTestEvent } from '../test/test-event.ts'

Deno.test('buttons', async (test) => {
  const target = new EventTarget()
  using pointer = DefaultPointer(target)

  await test.step('init', () => {
    assertEquals(pointer.primary, undefined)
    assertEquals(pointer.secondary, [])
    assertEquals(pointer.centerClient, undefined)
  })

  await test.step('primary down', () => {
    target.dispatchEvent(PointerTestEvent('pointerdown', {
      buttons: 1,
      offsetX: 10,
      offsetY: 40,
      isPrimary: true
    }))
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.xyClient, {x: 10, y: 40})
    assertEquals(pointer.secondary, [])
    assertEquals(pointer.centerClient, {x: 10, y: 40})
  })

  await test.step('secondary down', () => {
    target.dispatchEvent(PointerTestEvent('pointerdown', {
      buttons: 2,
      offsetX: 11,
      offsetY: 41,
      isPrimary: false
    }))
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.xyClient, {x: 10, y: 40})
    assertEquals(pointer.secondary[0]?.bits, 2)
    assertEquals(pointer.secondary[0]?.xyClient, {x: 11, y: 41})
    assertEquals(pointer.centerClient, {x: 10.5, y: 40.5})
  })

  await test.step('primary up', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {
      buttons: 0,
      offsetX: 11,
      offsetY: 41,
      isPrimary: true
    }))
    assertEquals(pointer.primary?.bits, 0)
    assertEquals(pointer.primary?.xyClient, {x: 11, y: 41})
    assertEquals(pointer.secondary[0]?.bits, 2)
    assertEquals(pointer.secondary[0]?.xyClient, {x: 11, y: 41})
    assertEquals(pointer.centerClient, {x: 11, y: 41})
  })
})

Deno.test('centerClient()', async (test) => {
  const target = new EventTarget()
  using pointer = DefaultPointer(target)

  await test.step('init', () => assertEquals(pointer.centerClient, undefined))

  await test.step('primary', () => {
    target.dispatchEvent(PointerTestEvent('pointerdown', {
      buttons: 1,
      offsetX: 10,
      offsetY: 10,
      isPrimary: true
    }))
    assertEquals(pointer.centerClient, {x: 10, y: 10})
  })

  await test.step('primary and secondary', () => {
    target.dispatchEvent(PointerTestEvent('pointerdown', {
      buttons: 1,
      offsetX: 20,
      offsetY: 20,
      isPrimary: false,
      pointerId: 2
    }))
    assertEquals(pointer.centerClient, {x: 15, y: 15})
  })
})

Deno.test('drag', async (test) => {
  const target = new EventTarget()
  using pointer = DefaultPointer(target)

  await test.step('click', () => {
    target.dispatchEvent(PointerTestEvent('pointerdown', {
      buttons: 1,
      offsetX: 10,
      offsetY: 10,
      isPrimary: true
    }))
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.primary, true)
    assertEquals(pointer.primary?.xyClient, {x: 10, y: 10})
    assertEquals(pointer.primary?.anchorClient, {x: 10, y: 10})
    assertEquals(pointer.primary?.drag, false)
  })

  await test.step('move a little', () => {
    target.dispatchEvent(PointerTestEvent('pointermove', {
      buttons: 1,
      offsetX: 12,
      offsetY: 12,
      isPrimary: true
    }))
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.primary, true)
    assertEquals(pointer.primary?.xyClient, {x: 12, y: 12})
    assertEquals(pointer.primary?.anchorClient, {x: 10, y: 10})
    assertEquals(pointer.primary?.drag, false)
  })

  await test.step('drag start', () => {
    target.dispatchEvent(PointerTestEvent('pointermove', {
      buttons: 1,
      offsetX: 15,
      offsetY: 15,
      isPrimary: true
    }))
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.primary, true)
    assertEquals(pointer.primary?.xyClient, {x: 15, y: 15})
    assertEquals(pointer.primary?.anchorClient, {x: 10, y: 10})
    assertEquals(pointer.primary?.drag, true)
  })

  await test.step('drag move', () => {
    target.dispatchEvent(PointerTestEvent('pointermove', {
      buttons: 1,
      offsetX: 17,
      offsetY: 17,
      isPrimary: true
    }))
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.primary, true)
    assertEquals(pointer.primary?.xyClient, {x: 17, y: 17})
    assertEquals(pointer.primary?.anchorClient, {x: 10, y: 10})
    assertEquals(pointer.primary?.drag, true)
  })

  await test.step('drag end', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {
      buttons: 0,
      offsetX: 20,
      offsetY: 20,
      isPrimary: true
    }))
    assertEquals(pointer.primary?.bits, 0)
    assertEquals(pointer.primary?.primary, true)
    assertEquals(pointer.primary?.xyClient, {x: 20, y: 20})
    assertEquals(pointer.primary?.anchorClient, {x: 10, y: 10})
    assertEquals(pointer.primary?.drag, false)
  })
})

function DefaultPointer(target: EventTarget): Pointer {
  const pointer = new Pointer(target)
  pointer.bitByButton[1] = 1
  pointer.bitByButton[2] = 2
  return pointer.register('add')
}
