import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {DevicePixelRatioMock} from '../test/device-pixel-ratio-mock.ts'
import {PointerTestEvent} from '../test/test-event.ts'
import {Pointer} from './pointer.ts'

test('Pointer', async ctx => {
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({left: 0, top: 0, width: 100, height: 100}),
    height: 100,
    setPointerCapture: () => {},
    width: 100
  }) as unknown as HTMLCanvasElement
  const pointer = new Pointer(target)
  pointer.register('add')

  await ctx.test('retains an end record through postupdate', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, pointerType: 'touch'})
    )
    target.dispatchEvent(PointerTestEvent('pointerup', {pointerType: 'touch'}))
    assert(pointer.polls[1]!.buttons, 0)
    pointer.postupdate()
    assert(pointer.polls, {})
  })

  await ctx.test('retains cancellation through postupdate', () => {
    target.dispatchEvent(PointerTestEvent('pointerdown', {buttons: 1}))
    target.dispatchEvent(PointerTestEvent('pointercancel'))
    assert(pointer.polls[1]!.buttons, 0)
    pointer.postupdate()
    assert(pointer.polls, {})
  })

  await ctx.test('keeps a renewed pointer after postupdate', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, pointerType: 'touch'})
    )
    target.dispatchEvent(PointerTestEvent('pointerup', {pointerType: 'touch'}))
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, pointerType: 'touch'})
    )
    pointer.postupdate()
    assert(pointer.polls[1]!.buttons, 1)
  })

  await ctx.test('keeps mouse position after pointerup', () => {
    target.dispatchEvent(PointerTestEvent('pointerdown', {buttons: 1}))
    target.dispatchEvent(PointerTestEvent('pointerup'))
    pointer.postupdate()
    assert(pointer.polls[1]!.buttons, 0)
    target.dispatchEvent(PointerTestEvent('pointerleave'))
    assert(pointer.polls, {})
  })

  await ctx.test('ends active pointers on reset', () => {
    target.dispatchEvent(PointerTestEvent('pointerdown', {buttons: 1}))
    pointer.reset()
    assert(pointer.polls[1]!.buttons, 0)
    pointer.postupdate()
    assert(pointer.polls, {})
  })

  await ctx.test('keeps a pressed pointer on leave', () => {
    target.dispatchEvent(PointerTestEvent('pointerdown', {buttons: 1}))
    target.dispatchEvent(PointerTestEvent('pointerleave', {buttons: 1}))
    assert(pointer.polls[1]!.buttons, 1)
  })

  pointer.register('remove')
})
