import { assertEquals } from '@std/assert'
import { Wheel } from './wheel.ts'

Deno.test('Wheel', async (test) => {
  const target = new EventTarget()
  using wheel = new Wheel(target).register('add')

  await test.step('init', () => {
    assertEquals(wheel.clientDelta, undefined)
  })

  await test.step('event', () => {
    target.dispatchEvent(WheelEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
    assertEquals(wheel.clientDelta, {x: 1, y: 2, z: 3})
  })
})

function WheelEvent(init: Partial<WheelEvent>): Event {
  return Object.assign(new Event('wheel'), init)
}
