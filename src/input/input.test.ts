import {expect, test} from 'vitest'
import {Cam} from '../renderer/cam.js'
import {Input} from './input.js'

type Button = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15
const cam: Cam = new Cam()
const target: EventTarget = new EventTarget()
const canvas: HTMLCanvasElement = <HTMLCanvasElement>(<unknown>target)
canvas.setPointerCapture = () => {}

test('buttons are initially inactive', () => {
  const input = new Input(cam, canvas)
  input.register('add')
  expect(input.isOn(1)).toBe(false)
  expect(input.isOnStart(1)).toBe(false)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart(1)).toBe(false)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isComboStart(1)).toBe(false)
  input.register('remove')
})

test('pressed buttons are active and triggered', () => {
  const input = new Input(cam, canvas)
  input.register('add')
  dispatchPointerEvent('pointerdown', 1)
  input.poll(16)
  expect(input.isOn(1)).toBe(true)
  expect(input.isOnStart(1)).toBe(true)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart(1)).toBe(false)
  expect(input.isCombo(1)).toBe(true)
  expect(input.isComboStart(1)).toBe(true)
  input.register('remove')
})

test('held buttons are active but not triggered', () => {
  const input = new Input(cam, canvas)
  input.register('add')
  dispatchPointerEvent('pointerdown', 1)
  input.poll(300)
  input.poll(16)
  expect(input.isOn(1)).toBe(true)
  expect(input.isOnStart(1)).toBe(false)
  expect(input.isHeld()).toBe(true)
  expect(input.isOffStart(1)).toBe(false)
  expect(input.isCombo(1)).toBe(true)
  expect(input.isComboStart(1)).toBe(false)
  input.register('remove')
})

test('released buttons are off and triggered', () => {
  const input = new Input(cam, canvas)
  input.register('add')
  dispatchPointerEvent('pointerdown', 1)
  input.poll(16)

  dispatchPointerEvent('pointerup', 1)
  input.poll(16)

  expect(input.isOn(1)).toBe(false)
  expect(input.isOnStart(1)).toBe(false)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart(1)).toBe(true)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isComboStart(1)).toBe(false)

  input.register('remove')
})

test('combos are exact in length', () => {
  const input = new Input<Button>(cam, canvas)
  input.register('add')

  dispatchPointerEvent('pointerdown', 1)
  input.poll(16)
  expect(input.isCombo(1)).toBe(true)
  dispatchPointerEvent('pointerup', 1)
  input.poll(16)

  dispatchPointerEvent('pointerdown', 2)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(1, 2)).toBe(true)
  dispatchPointerEvent('pointerup', 2)

  dispatchPointerEvent('pointerdown', 4)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(4)).toBe(false)
  expect(input.isCombo(2, 4)).toBe(false)
  expect(input.isCombo(1, 2, 4)).toBe(true)
  dispatchPointerEvent('pointerup', 4)
  input.poll(16)

  input.register('remove')
})

test('simultaneously pressed buttons are active and triggered', () => {
  const input = new Input(cam, canvas)
  input.register('add')
  dispatchPointerEvent('pointerdown', 1)
  dispatchPointerEvent('pointerdown', 2)
  input.poll(16)

  expect(input.isOn(3)).toBe(true)
  expect(input.isOnStart(3)).toBe(true)
  expect(input.isHeld()).toBe(false)
  expect(input.isOffStart(3)).toBe(false)

  expect(input.isCombo(1)).toBe(false)
  expect(input.isComboStart(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isComboStart(2)).toBe(false)
  expect(input.isCombo(3)).toBe(true)
  expect(input.isComboStart(3)).toBe(true)

  input.register('remove')
})

test('combos buttons are exact', () => {
  const input = new Input<Button>(cam, canvas)
  input.register('add')

  dispatchPointerEvent('pointerdown', 1)
  input.poll(16)
  expect(input.isCombo(1)).toBe(true)
  dispatchPointerEvent('pointerup', 1)

  dispatchPointerEvent('pointerdown', 2)
  dispatchPointerEvent('pointerdown', 8)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(1, 2)).toBe(false)
  dispatchPointerEvent('pointerup', 2)
  dispatchPointerEvent('pointerup', 8)

  dispatchPointerEvent('pointerdown', 4)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(4)).toBe(false)
  expect(input.isCombo(2, 4)).toBe(false)
  expect(input.isCombo(1, 2, 4)).toBe(false)
  dispatchPointerEvent('pointerup', 4)
  input.poll(16)

  input.register('remove')
})

test('a long combo is active and triggered', () => {
  const input = new Input<Button>(cam, canvas)
  input.register('add')

  const keys = <const>[1, 1, 2, 2, 8, 4, 8, 4]
  for (const [i, key] of keys.entries()) {
    dispatchPointerEvent('pointerdown', key)
    input.poll(16)
    if (i === keys.length - 1) break

    dispatchPointerEvent('pointerup', key)
    input.poll(16)
  }

  expect(input.isCombo(...keys)).toBe(true)
  expect(input.isComboStart(...keys)).toBe(true)
  expect(input.isHeld()).toBe(false)

  input.register('remove')
})

test('around-the-world combo is active and triggered', () => {
  const input = new Input<Button>(cam, canvas)
  input.register('add')

  const keyCombo = <const>[1, 9, 8, 10, 2, 6, 4, 5]
  for (const [i, buttons] of keyCombo.entries()) {
    dispatchPointerEvent('pointerdown', buttons)
    input.poll(16)
    if (i === keyCombo.length - 1) break

    dispatchPointerEvent('pointerup', buttons)
    input.poll(16)
  }

  expect(input.isCombo(...keyCombo)).toBe(true)
  expect(input.isComboStart(...keyCombo)).toBe(true)
  expect(input.isHeld()).toBe(false)

  input.register('remove')
})

test('combo expired', () => {
  const input = new Input<Button>(cam, canvas)
  input.register('add')

  dispatchPointerEvent('pointerdown', 1)
  input.poll(16)
  expect(input.isCombo(1)).toBe(true)
  dispatchPointerEvent('pointerup', 1)

  dispatchPointerEvent('pointerdown', 2)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(1, 2)).toBe(true)
  dispatchPointerEvent('pointerup', 2)
  input.poll(1000)

  dispatchPointerEvent('pointerdown', 4)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(4)).toBe(false)
  expect(input.isCombo(2, 4)).toBe(false)
  expect(input.isCombo(1, 2, 4)).toBe(false)
  dispatchPointerEvent('pointerup', 4)
  input.poll(16)

  input.register('remove')
})

test('long-pressed combo is active and held', () => {
  const input = new Input<Button>(cam, canvas)
  input.register('add')

  dispatchPointerEvent('pointerdown', 1)
  input.poll(16)
  expect(input.isCombo(1)).toBe(true)
  dispatchPointerEvent('pointerup', 1)

  dispatchPointerEvent('pointerdown', 2)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(1, 2)).toBe(true)
  dispatchPointerEvent('pointerup', 2)

  dispatchPointerEvent('pointerdown', 4)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(4)).toBe(false)
  expect(input.isCombo(2, 4)).toBe(false)
  expect(input.isCombo(1, 2, 4)).toBe(true)
  input.poll(1000)
  input.poll(16)

  expect(input.isCombo(1, 2, 4)).toBe(true)
  expect(input.isHeld()).toBe(true)

  input.register('remove')
})

test('combo after long-pressed combo is active', () => {
  const input = new Input<Button>(cam, canvas)
  input.register('add')

  dispatchPointerEvent('pointerdown', 1)
  input.poll(16)
  expect(input.isCombo(1)).toBe(true)
  dispatchPointerEvent('pointerup', 1)

  dispatchPointerEvent('pointerdown', 2)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(1, 2)).toBe(true)
  dispatchPointerEvent('pointerup', 2)

  dispatchPointerEvent('pointerdown', 4)
  input.poll(16)
  expect(input.isCombo(1)).toBe(false)
  expect(input.isCombo(2)).toBe(false)
  expect(input.isCombo(4)).toBe(false)
  expect(input.isCombo(2, 4)).toBe(false)
  expect(input.isCombo(1, 2, 4)).toBe(true)
  input.poll(1000)
  dispatchPointerEvent('pointerup', 4)

  input.poll(16)

  dispatchPointerEvent('pointerdown', 8)
  input.poll(16)
  dispatchPointerEvent('pointerup', 8)

  dispatchPointerEvent('pointerdown', 2)
  input.poll(16)
  dispatchPointerEvent('pointerup', 2)

  dispatchPointerEvent('pointerdown', 1)
  input.poll(16)

  expect(input.isCombo(8, 2, 1)).toBe(true)

  input.register('remove')
})

function dispatchPointerEvent(
  type: 'pointerdown' | 'pointerup',
  buttons: Button
): void {
  target.dispatchEvent(
    Object.assign(new Event(type), {
      buttons,
      isPrimary: true
    } satisfies Partial<PointerEvent>)
  )
}
