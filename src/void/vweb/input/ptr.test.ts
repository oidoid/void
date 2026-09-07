import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {DevicePixelRatioMock} from '../test/device-pixel-ratio-mock.ts'
import {DocumentMock} from '../test/document-mock.ts'
import {PtrTestEvent} from '../test/test-event.ts'
import {Ptr} from './ptr.ts'

test('Ptr', async ctx => {
  using _doc = new DocumentMock()
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 100}),
    height: 100,
    setPointerCapture: () => {},
    width: 100
  }) as unknown as HTMLCanvasElement
  const ptr = new Ptr(target)
  ptr.register('add')

  await ctx.test('reports ptr event names', () => {
    const events: string[] = []
    ptr.onEvent = event => events.push(event)
    target.dispatchEvent(PtrTestEvent('pointermove'))
    assert(events, ['input-pointermove'])
    ptr.onEvent = () => {}
  })

  await ctx.test('retains an end record through postupdate', () => {
    target.dispatchEvent(
      PtrTestEvent('pointerdown', {buttons: 1, pointerType: 'touch'})
    )
    target.dispatchEvent(PtrTestEvent('pointerup', {pointerType: 'touch'}))
    assert(ptr.polls[1]!.buttons, 0)
    ptr.postupdate()
    assert(ptr.polls, {})
  })

  await ctx.test('retains cancellation through postupdate', () => {
    target.dispatchEvent(PtrTestEvent('pointerdown', {buttons: 1}))
    target.dispatchEvent(PtrTestEvent('pointercancel'))
    assert(ptr.polls[1]!.buttons, 0)
    ptr.postupdate()
    assert(ptr.polls, {})
  })

  await ctx.test('keeps a renewed ptr after postupdate', () => {
    target.dispatchEvent(
      PtrTestEvent('pointerdown', {buttons: 1, pointerType: 'touch'})
    )
    target.dispatchEvent(PtrTestEvent('pointerup', {pointerType: 'touch'}))
    target.dispatchEvent(
      PtrTestEvent('pointerdown', {buttons: 1, pointerType: 'touch'})
    )
    ptr.postupdate()
    assert(ptr.polls[1]!.buttons, 1)
  })

  await ctx.test('keeps mouse position after pointerup', () => {
    target.dispatchEvent(PtrTestEvent('pointerdown', {buttons: 1}))
    target.dispatchEvent(PtrTestEvent('pointerup'))
    ptr.postupdate()
    assert(ptr.polls[1]!.buttons, 0)
    target.dispatchEvent(PtrTestEvent('pointerleave'))
    assert(ptr.polls, {})
  })

  await ctx.test('ends active ptrs on reset', () => {
    target.dispatchEvent(PtrTestEvent('pointerdown', {buttons: 1}))
    ptr.reset()
    assert(ptr.polls[1]!.buttons, 0)
    ptr.postupdate()
    assert(ptr.polls, {})
  })

  await ctx.test('keeps a pressed ptr on leave', () => {
    target.dispatchEvent(PtrTestEvent('pointerdown', {buttons: 1}))
    target.dispatchEvent(PtrTestEvent('pointerleave', {buttons: 1}))
    assert(ptr.polls[1]!.buttons, 1)
  })

  ptr.register('remove')
})

test('ptr registers ptrlock changes', () => {
  using doc = new DocumentMock()
  const target = new EventTarget() as unknown as HTMLCanvasElement
  const ptr = new Ptr(target)
  const events: string[] = []
  ptr.onEvent = event => events.push(event)
  ptr.register('add')
  doc.dispatchEvent(new Event('pointerlockchange'))
  assert(events, ['input-pointerlockchange'])
  ptr.register('remove')
  doc.dispatchEvent(new Event('pointerlockchange'))
  assert(events, ['input-pointerlockchange'])
})
