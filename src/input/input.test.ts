import { assertStrictEquals } from 'std/testing/asserts.ts'
import { Cam } from '../graphics/cam.ts'
import { Input, StandardButton } from './input.ts'

const cam = new Cam()
const canvas = {
  addEventListener() {},
  removeEventListener() {},
  requestPointerLock() {},
} as unknown as HTMLCanvasElement
globalThis.isSecureContext = true
navigator.getGamepads = () => []

Deno.test('buttons are initially inactive', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')
  assertStrictEquals(input.isOn('U'), false)
  assertStrictEquals(input.isOnStart('U'), false)
  assertStrictEquals(input.isHeld(), false)
  assertStrictEquals(input.isOffStart('U'), false)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isComboStart(['U']), false)
  input.register('remove')
})

Deno.test('pressed buttons are active and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertStrictEquals(input.isOn('U'), true)
  assertStrictEquals(input.isOnStart('U'), true)
  assertStrictEquals(input.isHeld(), false)
  assertStrictEquals(input.isOffStart('U'), false)
  assertStrictEquals(input.isCombo(['U']), true)
  assertStrictEquals(input.isComboStart(['U']), true)
  input.register('remove')
})

Deno.test('held buttons are active but not triggered', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(300)
  input.poll(16)
  assertStrictEquals(input.isOn('U'), true)
  assertStrictEquals(input.isOnStart('U'), false)
  assertStrictEquals(input.isHeld(), true)
  assertStrictEquals(input.isOffStart('U'), false)
  assertStrictEquals(input.isCombo(['U']), true)
  assertStrictEquals(input.isComboStart(['U']), false)
  input.register('remove')
})

Deno.test('released buttons are off and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)

  dispatchKeyEvent('keyup', 'ArrowUp')
  input.poll(16)

  assertStrictEquals(input.isOn('U'), false)
  assertStrictEquals(input.isOnStart('U'), false)
  assertStrictEquals(input.isHeld(), false)
  assertStrictEquals(input.isOffStart('U'), true)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isComboStart(['U']), false)

  input.register('remove')
})

Deno.test('combos are exact in length', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')
  input.poll(16)

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['U'], ['D']), true)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['R']), false)
  assertStrictEquals(input.isCombo(['D'], ['R']), false)
  assertStrictEquals(input.isCombo(['U'], ['D'], ['R']), true)
  dispatchKeyEvent('keyup', 'ArrowRight')
  input.poll(16)

  input.register('remove')
})

Deno.test('simultaneously pressed buttons are active and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)

  assertStrictEquals(input.isOn('U', 'D'), true)
  assertStrictEquals(input.isOnStart('U', 'D'), true)
  assertStrictEquals(input.isHeld(), false)
  assertStrictEquals(input.isOffStart('U', 'D'), false)

  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isComboStart(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isComboStart(['D']), false)
  assertStrictEquals(input.isCombo(['U', 'D']), true)
  assertStrictEquals(input.isComboStart(['U', 'D']), true)

  input.register('remove')
})

Deno.test('combos buttons are exact', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  dispatchKeyEvent('keydown', 'ArrowLeft')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['U'], ['D']), false)
  dispatchKeyEvent('keyup', 'ArrowDown')
  dispatchKeyEvent('keyup', 'ArrowLeft')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['R']), false)
  assertStrictEquals(input.isCombo(['D'], ['R']), false)
  assertStrictEquals(input.isCombo(['U'], ['D'], ['R']), false)
  dispatchKeyEvent('keyup', 'ArrowRight')
  input.poll(16)

  input.register('remove')
})

Deno.test('a long combo is active and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  const keys = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
  ] as const
  for (const [i, key] of keys.entries()) {
    dispatchKeyEvent('keydown', key)
    input.poll(16)
    if (i === (keys.length - 1)) break

    dispatchKeyEvent('keyup', key)
    input.poll(16)
  }

  const combo = keys.map((
    key,
  ) => [key.replace(/Arrow(.).+/, '$1') as StandardButton])
  assertStrictEquals(input.isCombo(...combo), true)
  assertStrictEquals(input.isComboStart(...combo), true)
  assertStrictEquals(input.isHeld(), false)

  input.register('remove')
})

Deno.test('around-the-world combo is active and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  const keyCombo = [
    ['ArrowUp'],
    ['ArrowUp', 'ArrowLeft'],
    ['ArrowLeft'],
    ['ArrowLeft', 'ArrowDown'],
    ['ArrowDown'],
    ['ArrowDown', 'ArrowRight'],
    ['ArrowRight'],
    ['ArrowUp', 'ArrowRight'],
  ] as const
  for (const [i, buttons] of keyCombo.entries()) {
    for (const button of buttons) {
      dispatchKeyEvent('keydown', button)
    }
    input.poll(16)
    if (i === (keyCombo.length - 1)) break

    for (const button of buttons) {
      dispatchKeyEvent('keyup', button)
    }
    input.poll(16)
  }

  const combo = keyCombo.map((
    keys,
  ) => keys.map((key) => key.replace(/Arrow(.).+/, '$1') as StandardButton))
  assertStrictEquals(input.isCombo(...combo), true)
  assertStrictEquals(input.isComboStart(...combo), true)
  assertStrictEquals(input.isHeld(), false)

  input.register('remove')
})

Deno.test('combo expired', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['U'], ['D']), true)
  dispatchKeyEvent('keyup', 'ArrowDown')
  input.poll(1000)

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['R']), false)
  assertStrictEquals(input.isCombo(['D'], ['R']), false)
  assertStrictEquals(input.isCombo(['U'], ['D'], ['R']), false)
  dispatchKeyEvent('keyup', 'ArrowRight')
  input.poll(16)

  input.register('remove')
})

Deno.test('long-pressed combo is active and held', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['U'], ['D']), true)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['R']), false)
  assertStrictEquals(input.isCombo(['D'], ['R']), false)
  assertStrictEquals(input.isCombo(['U'], ['D'], ['R']), true)
  input.poll(1000)
  input.poll(16)

  assertStrictEquals(input.isCombo(['U'], ['D'], ['R']), true)
  assertStrictEquals(input.isHeld(), true)

  input.register('remove')
})

Deno.test('combo after long-pressed combo is active', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['U'], ['D']), true)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertStrictEquals(input.isCombo(['U']), false)
  assertStrictEquals(input.isCombo(['D']), false)
  assertStrictEquals(input.isCombo(['R']), false)
  assertStrictEquals(input.isCombo(['D'], ['R']), false)
  assertStrictEquals(input.isCombo(['U'], ['D'], ['R']), true)
  input.poll(1000)
  dispatchKeyEvent('keyup', 'ArrowRight')

  input.poll(16)

  dispatchKeyEvent('keydown', 'ArrowLeft')
  input.poll(16)
  dispatchKeyEvent('keyup', 'ArrowLeft')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)

  assertStrictEquals(input.isCombo(['L'], ['D'], ['U']), true)

  input.register('remove')
})

function dispatchKeyEvent(type: 'keydown' | 'keyup', key: string): void {
  dispatchEvent(Object.assign(new CustomEvent(type), { key }))
}
