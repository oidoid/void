import { assertEquals } from 'std/testing/asserts.ts'
import { Cam } from '../graphics/cam.ts'
import { Input, StandardButton } from './input.ts'

const cam = new Cam()
const canvas = {
  addEventListener() {},
  removeEventListener() {},
  requestPointerLock() {},
} as unknown as HTMLCanvasElement
globalThis.isSecureContext = true
globalThis.navigator.getGamepads = () => []

Deno.test('buttons are initially inactive', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')
  assertEquals(input.isOn('U'), false)
  assertEquals(input.isOnStart('U'), false)
  assertEquals(input.isHeld(), false)
  assertEquals(input.isOffStart('U'), false)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isComboStart(['U']), false)
  input.register('remove')
})

Deno.test('pressed buttons are active and triggered', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertEquals(input.isOn('U'), true)
  assertEquals(input.isOnStart('U'), true)
  assertEquals(input.isHeld(), false)
  assertEquals(input.isOffStart('U'), false)
  assertEquals(input.isCombo(['U']), true)
  assertEquals(input.isComboStart(['U']), true)
  input.register('remove')
})

Deno.test('held buttons are active but not triggered', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(300)
  input.poll(16)
  assertEquals(input.isOn('U'), true)
  assertEquals(input.isOnStart('U'), false)
  assertEquals(input.isHeld(), true)
  assertEquals(input.isOffStart('U'), false)
  assertEquals(input.isCombo(['U']), true)
  assertEquals(input.isComboStart(['U']), false)
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

  assertEquals(input.isOn('U'), false)
  assertEquals(input.isOnStart('U'), false)
  assertEquals(input.isHeld(), false)
  assertEquals(input.isOffStart('U'), true)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isComboStart(['U']), false)

  input.register('remove')
})

Deno.test('combos are exact in length', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')
  input.poll(16)

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['U'], ['D']), true)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['R']), false)
  assertEquals(input.isCombo(['D'], ['R']), false)
  assertEquals(input.isCombo(['U'], ['D'], ['R']), true)
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

  assertEquals(input.isOn('U', 'D'), true)
  assertEquals(input.isOnStart('U', 'D'), true)
  assertEquals(input.isHeld(), false)
  assertEquals(input.isOffStart('U', 'D'), false)

  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isComboStart(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isComboStart(['D']), false)
  assertEquals(input.isCombo(['U', 'D']), true)
  assertEquals(input.isComboStart(['U', 'D']), true)

  input.register('remove')
})

Deno.test('combos buttons are exact', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  dispatchKeyEvent('keydown', 'ArrowLeft')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['U'], ['D']), false)
  dispatchKeyEvent('keyup', 'ArrowDown')
  dispatchKeyEvent('keyup', 'ArrowLeft')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['R']), false)
  assertEquals(input.isCombo(['D'], ['R']), false)
  assertEquals(input.isCombo(['U'], ['D'], ['R']), false)
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
  assertEquals(input.isCombo(...combo), true)
  assertEquals(input.isComboStart(...combo), true)
  assertEquals(input.isHeld(), false)

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
  assertEquals(input.isCombo(...combo), true)
  assertEquals(input.isComboStart(...combo), true)
  assertEquals(input.isHeld(), false)

  input.register('remove')
})

Deno.test('combo expired', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['U'], ['D']), true)
  dispatchKeyEvent('keyup', 'ArrowDown')
  input.poll(1000)

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['R']), false)
  assertEquals(input.isCombo(['D'], ['R']), false)
  assertEquals(input.isCombo(['U'], ['D'], ['R']), false)
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
  assertEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['U'], ['D']), true)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['R']), false)
  assertEquals(input.isCombo(['D'], ['R']), false)
  assertEquals(input.isCombo(['U'], ['D'], ['R']), true)
  input.poll(1000)
  input.poll(16)

  assertEquals(input.isCombo(['U'], ['D'], ['R']), true)
  assertEquals(input.isHeld(), true)

  input.register('remove')
})

Deno.test('combo after long-pressed combo is active', () => {
  const input = new Input(cam, canvas)
  input.mapStandard()
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.poll(16)
  assertEquals(input.isCombo(['U']), true)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['U'], ['D']), true)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.poll(16)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isCombo(['D']), false)
  assertEquals(input.isCombo(['R']), false)
  assertEquals(input.isCombo(['D'], ['R']), false)
  assertEquals(input.isCombo(['U'], ['D'], ['R']), true)
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

  assertEquals(input.isCombo(['L'], ['D'], ['U']), true)

  input.register('remove')
})

function dispatchKeyEvent(type: 'keydown' | 'keyup', key: string): void {
  globalThis.dispatchEvent(Object.assign(new CustomEvent(type), { key }))
}
