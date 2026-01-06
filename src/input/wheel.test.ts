import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {WheelTestEvent} from '../test/test-event.ts'
import {Wheel} from './wheel.ts'

test('Wheel', async ctx => {
  const target = new EventTarget()
  using wheel = new Wheel(target).register('add')

  await ctx.test('init', () => assert(wheel.deltaClient, undefined))

  await ctx.test('modifiers', () => {
    target.dispatchEvent(
      WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3, metaKey: true})
    )
    assert(wheel.deltaClient, undefined)
    target.dispatchEvent(
      WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3, altKey: true})
    )
    assert(wheel.deltaClient, undefined)
    target.dispatchEvent(
      WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3, ctrlKey: true})
    )
    assert(wheel.deltaClient, undefined)
  })

  await ctx.test('untrusted', () => {
    target.dispatchEvent(
      Object.assign(new Event('wheel'), {deltaX: 4, deltaY: 5, deltaZ: 6})
    )
    assert(wheel.deltaClient, undefined)
  })

  await ctx.test('event', () => {
    target.dispatchEvent(WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
    assert(wheel.deltaClient, {x: 1, y: 2, z: 3})
  })

  await ctx.test('postupdate', () => {
    wheel.postupdate()
    assert(wheel.deltaClient, undefined)
  })
})
