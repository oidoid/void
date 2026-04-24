import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {WheelTestEvent} from '../test/test-event.ts'
import {Wheel} from './wheel.ts'

test('Wheel', async ctx => {
  const target = new EventTarget()
  using wheel = new Wheel(target).register('add')

  await ctx.test('init', () => {
    assert(wheel.deltaX, 0)
    assert(wheel.deltaY, 0)
    assert(wheel.deltaZ, 0)
  })

  await ctx.test('modifiers', () => {
    target.dispatchEvent(
      WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3, metaKey: true})
    )
    assert(wheel.deltaX, 0)
    assert(wheel.deltaY, 0)
    assert(wheel.deltaZ, 0)
    target.dispatchEvent(
      WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3, altKey: true})
    )
    assert(wheel.deltaX, 0)
    assert(wheel.deltaY, 0)
    assert(wheel.deltaZ, 0)
    target.dispatchEvent(
      WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3, ctrlKey: true})
    )
    assert(wheel.deltaX, 0)
    assert(wheel.deltaY, 0)
    assert(wheel.deltaZ, 0)
  })

  await ctx.test('untrusted', () => {
    target.dispatchEvent(
      WheelTestEvent({isTrusted: false, deltaX: 4, deltaY: 5, deltaZ: 6})
    )
    assert(wheel.deltaX, 0)
  })

  await ctx.test('event', () => {
    target.dispatchEvent(WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
    assert(wheel.deltaX, 1)
    assert(wheel.deltaY, 2)
    assert(wheel.deltaZ, 3)
  })

  await ctx.test('postupdate', () => {
    wheel.postupdate()
    assert(wheel.deltaX, 0)
    assert(wheel.deltaY, 0)
    assert(wheel.deltaZ, 0)
  })
})
