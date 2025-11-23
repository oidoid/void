import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {TestElement} from '../test/test-element.ts'
import {PointerTestEvent} from '../test/test-event.ts'
import {Pointer} from './pointer.ts'

test('buttons', ctx => {
  const target = TestElement()
  using pointer = DefaultPointer(target)

  ctx.test('init', () => {
    assert(pointer.primary, undefined)
    assert(pointer.secondary, {})
    assert(pointer.centerClient, undefined)
    assert(pointer.pinchClient, undefined)
    assert(pointer.invalid, false)
  })

  ctx.test('primary down', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 10, offsetY: 40})
    )
    pointer.update()
    assert(pointer.primary?.bits, 1)
    assert(pointer.primary?.clickClient, {x: 10, y: 40})
    assert(pointer.primary?.xyClient, {x: 10, y: 40})
    assert(pointer.centerClient, {x: 10, y: 40})
    assert(pointer.pinchClient, undefined)
    assert(pointer.invalid, true)
  })

  ctx.test('secondary down', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 2,
        offsetX: 11,
        offsetY: 41,
        pointerId: 2
      })
    )
    pointer.update()
    assert(pointer.primary?.bits, 1)
    assert(pointer.primary?.clickClient, {x: 10, y: 40})
    assert(pointer.primary?.xyClient, {x: 10, y: 40})
    assert(pointer.secondary[2]?.bits, 2)
    assert(pointer.secondary[2]?.clickClient, {x: 11, y: 41})
    assert(pointer.secondary[2]?.xyClient, {x: 11, y: 41})
    assert(pointer.centerClient, {x: 10.5, y: 40.5})
    assert(pointer.pinchClient, {x: 0, y: 0})
    assert(pointer.invalid, true)
  })

  ctx.test('primary up', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerup', {offsetX: 11, offsetY: 41})
    )
    pointer.update()
    assert(pointer.primary?.bits, 0)
    assert(pointer.primary?.clickClient, undefined)
    assert(pointer.primary?.xyClient, {x: 11, y: 41})
    assert(pointer.secondary[2]?.bits, 2)
    assert(pointer.secondary[2]?.clickClient, {x: 11, y: 41})
    assert(pointer.secondary[2]?.xyClient, {x: 11, y: 41})
    assert(pointer.centerClient, {x: 11, y: 41})
    assert(pointer.pinchClient, undefined)
    assert(pointer.invalid, true)
  })
})

test('centerClient()', ctx => {
  const target = TestElement()
  using pointer = DefaultPointer(target)

  ctx.test('init', () => assert(pointer.centerClient, undefined))

  ctx.test('primary', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    pointer.update()
    assert(pointer.centerClient, {x: 10, y: 10})
  })

  ctx.test('primary and secondary', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 20,
        offsetY: 20,
        pointerId: 2
      })
    )
    pointer.update()
    assert(pointer.centerClient, {x: 15, y: 15})
  })
})

test('pinchClient()', ctx => {
  const target = TestElement()
  using pointer = DefaultPointer(target)

  ctx.test('init', () => assert(pointer.pinchClient, undefined))

  ctx.test('primary down', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    pointer.update()
    assert(pointer.pinchClient, undefined)
  })

  ctx.test('primary move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 20, offsetY: 20})
    )
    pointer.update()
    assert(pointer.pinchClient, undefined)
  })

  ctx.test('secondary down', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 30,
        offsetY: 20,
        pointerId: 2
      })
    )
    pointer.update()
    assert(pointer.pinchClient, {x: 0, y: 0})
  })

  ctx.test('secondary move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 40,
        offsetY: 20,
        pointerId: 2
      })
    )
    pointer.update()
    assert(pointer.pinchClient, {x: 10, y: 0})
  })

  ctx.test('primary move again', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 30, offsetY: 20})
    )
    pointer.update()
    assert(pointer.pinchClient, {x: 0, y: 0})
  })
})

test('drag', ctx => {
  const target = TestElement()
  using pointer = DefaultPointer(target)

  ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    pointer.update()
    assert(pointer.primary?.bits, 1)
    assert(pointer.primary?.primary, true)
    assert(pointer.primary?.clickClient, {x: 10, y: 10})
    assert(pointer.primary?.xyClient, {x: 10, y: 10})
    assert(pointer.primary?.drag, false)
    assert(pointer.invalid, true)
  })

  ctx.test('move a little', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 12, offsetY: 12})
    )
    pointer.update()
    assert(pointer.primary?.bits, 1)
    assert(pointer.primary?.primary, true)
    assert(pointer.primary?.clickClient, {x: 10, y: 10})
    assert(pointer.primary?.xyClient, {x: 12, y: 12})
    assert(pointer.primary?.drag, false)
    assert(pointer.invalid, true)
  })

  ctx.test('drag start', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 15, offsetY: 15})
    )
    pointer.update()
    assert(pointer.primary?.bits, 1)
    assert(pointer.primary?.primary, true)
    assert(pointer.primary?.clickClient, {x: 10, y: 10})
    assert(pointer.primary?.xyClient, {x: 15, y: 15})
    assert(pointer.primary?.drag, true)
    assert(pointer.invalid, true)
  })

  ctx.test('drag move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 17, offsetY: 17})
    )
    pointer.update()
    assert(pointer.primary?.bits, 1)
    assert(pointer.primary?.primary, true)
    assert(pointer.primary?.clickClient, {x: 10, y: 10})
    assert(pointer.primary?.xyClient, {x: 17, y: 17})
    assert(pointer.primary?.drag, true)
    assert(pointer.invalid, true)
  })

  ctx.test('drag end', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerup', {offsetX: 20, offsetY: 20})
    )
    pointer.update()
    assert(pointer.primary?.bits, 0)
    assert(pointer.primary?.primary, true)
    assert(pointer.primary?.clickClient, undefined)
    assert(pointer.primary?.xyClient, {x: 20, y: 20})
    assert(pointer.primary?.drag, false)
    assert(pointer.invalid, true)
  })
})

function DefaultPointer(target: Element): Pointer {
  const pointer = new Pointer(target)
  pointer.bitByButton[1] = 1
  pointer.bitByButton[2] = 2
  return pointer.register('add')
}
