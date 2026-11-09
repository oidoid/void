import {afterAll, describe, expect, test} from 'bun:test'
import {DevicePixelRatioMock} from '../test/device-pixel-ratio-mock.ts'
import {DocumentMock} from '../test/document-mock.ts'
import {TestEventTarget} from '../test/test-event-target.ts'
import {PtrTestEvent} from '../test/test-event.ts'
import {Ptr} from './ptr.ts'

describe('Ptr', () => {
  const doc = new DocumentMock()
  const dpr = new DevicePixelRatioMock()
  dpr.ratio = 3
  const target = Object.assign(new TestEventTarget(), {
    getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 100}),
    height: 200,
    setPointerCapture: () => {},
    width: 200
  }) as unknown as HTMLCanvasElement
  const ptr = new Ptr(target)
  ptr.register('add')
  afterAll(() => {
    ptr.register('remove')
    dpr[Symbol.dispose]()
    doc[Symbol.dispose]()
  })

  test('reports ptr event names', () => {
    const events: string[] = []
    ptr.onEvent = event => events.push(event)
    target.dispatchEvent(PtrTestEvent('pointermove'))
    expect(events).toStrictEqual(['input-pointermove'])
    ptr.onEvent = () => {}
  })

  test('stores contact bounds around the pointer center', () => {
    target.dispatchEvent(
      PtrTestEvent('pointermove', {
        clientX: 40,
        clientY: 60,
        height: 8,
        width: 10
      })
    )
    expect(ptr.polls[1]!.physX).toBe(70)
    expect(ptr.polls[1]!.physY).toBe(112)
    expect(ptr.polls[1]!.physW).toBe(20)
    expect(ptr.polls[1]!.physH).toBe(16)
  })

  test('retains an end record through postupdate', () => {
    target.dispatchEvent(
      PtrTestEvent('pointerdown', {buttons: 1, pointerType: 'touch'})
    )
    target.dispatchEvent(PtrTestEvent('pointerup', {pointerType: 'touch'}))
    expect(ptr.polls[1]!.buttons).toBe(0)
    ptr.postupdate()
    expect(ptr.polls).toStrictEqual({})
  })

  test('retains cancellation through postupdate', () => {
    target.dispatchEvent(PtrTestEvent('pointerdown', {buttons: 1}))
    target.dispatchEvent(PtrTestEvent('pointercancel'))
    expect(ptr.polls[1]!.buttons).toBe(0)
    ptr.postupdate()
    expect(ptr.polls).toStrictEqual({})
  })

  test('keeps a renewed ptr after postupdate', () => {
    target.dispatchEvent(
      PtrTestEvent('pointerdown', {buttons: 1, pointerType: 'touch'})
    )
    target.dispatchEvent(PtrTestEvent('pointerup', {pointerType: 'touch'}))
    target.dispatchEvent(
      PtrTestEvent('pointerdown', {buttons: 1, pointerType: 'touch'})
    )
    ptr.postupdate()
    expect(ptr.polls[1]!.buttons).toBe(1)
  })

  test('keeps mouse position after pointerup', () => {
    target.dispatchEvent(PtrTestEvent('pointerdown', {buttons: 1}))
    target.dispatchEvent(PtrTestEvent('pointerup'))
    ptr.postupdate()
    expect(ptr.polls[1]!.buttons).toBe(0)
    target.dispatchEvent(PtrTestEvent('pointerleave'))
    expect(ptr.polls).toStrictEqual({})
  })

  test('ends active ptrs on reset', () => {
    target.dispatchEvent(PtrTestEvent('pointerdown', {buttons: 1}))
    ptr.reset()
    expect(ptr.polls[1]!.buttons).toBe(0)
    ptr.postupdate()
    expect(ptr.polls).toStrictEqual({})
  })

  test('keeps a pressed ptr on leave', () => {
    target.dispatchEvent(PtrTestEvent('pointerdown', {buttons: 1}))
    target.dispatchEvent(PtrTestEvent('pointerleave', {buttons: 1}))
    expect(ptr.polls[1]!.buttons).toBe(1)
  })
})

test('ptr registers ptrlock changes', () => {
  using doc = new DocumentMock()
  const target = new EventTarget() as unknown as HTMLCanvasElement
  const ptr = new Ptr(target)
  const events: string[] = []
  ptr.onEvent = event => events.push(event)
  ptr.register('add')
  doc.dispatchEvent(new Event('pointerlockchange'))
  expect(events).toStrictEqual(['input-pointerlockchange'])
  ptr.register('remove')
  doc.dispatchEvent(new Event('pointerlockchange'))
  expect(events).toStrictEqual(['input-pointerlockchange'])
})
