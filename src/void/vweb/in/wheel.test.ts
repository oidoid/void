import {afterAll, describe, expect, test} from 'bun:test'
import {TestEventTarget} from '../test/test-event-target.ts'
import {WheelTestEvent} from '../test/test-event.ts'
import {Wheel} from './wheel.ts'

describe('Wheel', () => {
  const target = new TestEventTarget()
  const wheel = new Wheel(target).register('add')
  afterAll(() => wheel[Symbol.dispose]())

  test('init', () => {
    expect(wheel.deltaX).toBe(0)
    expect(wheel.deltaY).toBe(0)
    expect(wheel.deltaZ).toBe(0)
  })

  test('modifiers', () => {
    target.dispatchEvent(
      WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3, metaKey: true})
    )
    expect(wheel.deltaX).toBe(0)
    expect(wheel.deltaY).toBe(0)
    expect(wheel.deltaZ).toBe(0)
    target.dispatchEvent(
      WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3, altKey: true})
    )
    expect(wheel.deltaX).toBe(0)
    expect(wheel.deltaY).toBe(0)
    expect(wheel.deltaZ).toBe(0)
    target.dispatchEvent(
      WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3, ctrlKey: true})
    )
    expect(wheel.deltaX).toBe(0)
    expect(wheel.deltaY).toBe(0)
    expect(wheel.deltaZ).toBe(0)
  })

  test('untrusted', () => {
    target.dispatchEvent(
      WheelTestEvent({isTrusted: false, deltaX: 4, deltaY: 5, deltaZ: 6})
    )
    expect(wheel.deltaX).toBe(0)
  })

  test('event', () => {
    target.dispatchEvent(WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
    expect(wheel.deltaX).toBe(1)
    expect(wheel.deltaY).toBe(2)
    expect(wheel.deltaZ).toBe(3)
  })

  test('postupdate', () => {
    wheel.postupdate()
    expect(wheel.deltaX).toBe(0)
    expect(wheel.deltaY).toBe(0)
    expect(wheel.deltaZ).toBe(0)
  })
})
