import { test } from 'node:test'
import { assert } from '../test/assert.ts'
import { WheelTestEvent } from '../test/test-event.ts'
import { Wheel } from './wheel.ts'

test('Wheel', async ctx => {
  const target = new EventTarget()
  using wheel = new Wheel(target).register('add')

  await ctx.test('init', () => {
    assert(wheel.x, 0)
    assert(wheel.y, 0)
    assert(wheel.z, 0)
  })

  await ctx.test('modifiers', () => {
    target.dispatchEvent(
      WheelTestEvent({ deltaX: 1, deltaY: 2, deltaZ: 3, metaKey: true })
    )
    assert(wheel.x, 0)
    assert(wheel.y, 0)
    assert(wheel.z, 0)
    target.dispatchEvent(
      WheelTestEvent({ deltaX: 1, deltaY: 2, deltaZ: 3, altKey: true })
    )
    assert(wheel.x, 0)
    assert(wheel.y, 0)
    assert(wheel.z, 0)
    target.dispatchEvent(
      WheelTestEvent({ deltaX: 1, deltaY: 2, deltaZ: 3, ctrlKey: true })
    )
    assert(wheel.x, 0)
    assert(wheel.y, 0)
    assert(wheel.z, 0)
  })

  await ctx.test('untrusted', () => {
    target.dispatchEvent(
      WheelTestEvent({ isTrusted: false, deltaX: 4, deltaY: 5, deltaZ: 6 })
    )
    assert(wheel.x, 0)
  })

  await ctx.test('event', () => {
    target.dispatchEvent(WheelTestEvent({ deltaX: 1, deltaY: 2, deltaZ: 3 }))
    assert(wheel.x, 1)
    assert(wheel.y, 2)
    assert(wheel.z, 3)
  })

  await ctx.test('postupdate', () => {
    wheel.postupdate()
    assert(wheel.x, 0)
    assert(wheel.y, 0)
    assert(wheel.z, 0)
  })
})
