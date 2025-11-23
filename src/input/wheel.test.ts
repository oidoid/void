import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {WheelTestEvent} from '../test/test-event.ts'
import {Wheel} from './wheel.ts'

test('Wheel', ctx => {
  const target = new EventTarget()
  using wheel = new Wheel(target).register('add')

  ctx.test('init', () => assert(wheel.deltaClient, undefined))

  ctx.test('event', () => {
    target.dispatchEvent(WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
    assert(wheel.deltaClient, {x: 1, y: 2, z: 3})
  })

  ctx.test('postupdate', () => {
    wheel.postupdate()
    assert(wheel.deltaClient, undefined)
  })
})
