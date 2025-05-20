import { assertEquals } from '@std/assert'
import { Wheel } from './wheel.ts'
import { WheelTestEvent } from '../test/test-event.ts'

Deno.test('Wheel', async (test) => {
  const target = new EventTarget()
  using wheel = new Wheel(target).register('add')

  await test.step('init', () => {
    assertEquals(wheel.clientDelta, undefined)
  })

  await test.step('event', () => {
    target.dispatchEvent(WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
    assertEquals(wheel.clientDelta, {x: 1, y: 2, z: 3})
  })
})
