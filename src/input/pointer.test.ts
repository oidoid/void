import { Pointer } from './pointer.ts'
import { assertEquals } from '@std/assert'
import { Cam } from '../cam.ts'

Deno.test('Pointer', async (test) => {
  const target = new EventTarget()
  globalThis.devicePixelRatio = 1
  const cam = new Cam()
  cam.clientWH = {w: 100, h: 200}
  using pointer = new Pointer(cam, target).register('add')
  pointer.bitByButton[1] = 1
  pointer.bitByButton[2] = 2

  await test.step('init', () => {
    assertEquals(pointer.primary, undefined)
    assertEquals(pointer.secondary, [])
    assertEquals(pointer.center, undefined)
  })

  await test.step('primary down', () => {
    const ev = PointerEvent('pointerdown', {
      buttons: 1,
      offsetX: 10,
      offsetY: 40,
      isPrimary: true
    })
    target.dispatchEvent(ev)
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.canvasXY, {x: 10, y: 40})
    assertEquals(pointer.primary?.clientXY, {x: 10, y: 40})
    assertEquals(pointer.primary?.xy, {x: 10, y: 40})
    assertEquals(pointer.secondary, [])
    assertEquals(pointer.center?.canvasXY, {x: 10, y: 40})
    assertEquals(pointer.center?.clientXY, {x: 10, y: 40})
    assertEquals(pointer.center?.xy, {x: 10, y: 40})
  })

  await test.step('secondary down', () => {
    const ev = PointerEvent('pointerdown', {
      buttons: 2,
      offsetX: 11,
      offsetY: 41,
      isPrimary: false
    })
    target.dispatchEvent(ev)
    assertEquals(pointer.primary?.bits, 1)
    assertEquals(pointer.primary?.canvasXY, {x: 10, y: 40})
    assertEquals(pointer.primary?.clientXY, {x: 10, y: 40})
    assertEquals(pointer.primary?.xy, {x: 10, y: 40})
    assertEquals(pointer.secondary[0]?.bits, 2)
    assertEquals(pointer.secondary[0]?.canvasXY, {x: 11, y: 41})
    assertEquals(pointer.secondary[0]?.clientXY, {x: 11, y: 41})
    assertEquals(pointer.secondary[0]?.xy, {x: 11, y: 41})
    assertEquals(pointer.center?.canvasXY, {x: 10.5, y: 40.5})
    assertEquals(pointer.center?.clientXY, {x: 10.5, y: 40.5})
    assertEquals(pointer.center?.xy, {x: 10.5, y: 40.5})
  })

  await test.step('primary up', () => {
    const ev = PointerEvent('pointerup', {
      buttons: 0,
      offsetX: 11,
      offsetY: 41,
      isPrimary: true
    })
    target.dispatchEvent(ev)
    assertEquals(pointer.primary?.bits, 0)
    assertEquals(pointer.primary?.canvasXY, {x: 11, y: 41})
    assertEquals(pointer.primary?.clientXY, {x: 11, y: 41})
    assertEquals(pointer.primary?.xy, {x: 11, y: 41})
    assertEquals(pointer.secondary[0]?.bits, 2)
    assertEquals(pointer.secondary[0]?.canvasXY, {x: 11, y: 41})
    assertEquals(pointer.secondary[0]?.clientXY, {x: 11, y: 41})
    assertEquals(pointer.secondary[0]?.xy, {x: 11, y: 41})
    assertEquals(pointer.center?.canvasXY, {x: 11, y: 41})
    assertEquals(pointer.center?.clientXY, {x: 11, y: 41})
    assertEquals(pointer.center?.xy, {x: 11, y: 41})
  })
})

function PointerEvent(type: string, init: Partial<PointerEvent>): Event {
  return Object.assign(new Event(type), init)
}
