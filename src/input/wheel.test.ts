import { assertEquals } from '@std/assert'
import { Cam } from '../cam.ts'
import { Wheel } from './wheel.ts'

Deno.test('Wheel', async (test) => {
  const target = new EventTarget()
  globalThis.devicePixelRatio = 1
  const cam = new Cam()
  cam.clientWH = {w: 100, h: 200}
  using wheel = new Wheel(cam, target).register('add')

  await test.step('init', () => {
    assertEquals(wheel.canvasDelta, undefined)
    assertEquals(wheel.clientDelta, undefined)
    assertEquals(wheel.delta, undefined)
  })

  await test.step('event', () => {
    target.dispatchEvent(WheelEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
    assertEquals(wheel.canvasDelta, {x: 1, y: 2})
    assertEquals(wheel.clientDelta, {x: 1, y: 2, z: 3})
    assertEquals(wheel.delta, {x: 1, y: 2})
  })
})

function WheelEvent(init: Partial<WheelEvent>): Event {
  return Object.assign(new Event('wheel'), init)
}
