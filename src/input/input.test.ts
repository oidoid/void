import { U16XY } from '@/ooz'
import {
  Button,
  Cam,
  GamepadHub,
  Input,
  PointerEventPub,
  PointerLock,
  SecureContext,
} from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

// to-do: require specific API, not Window.
const cam: Cam = new Cam(new U16XY(1, 1), undefined as unknown as Window)
const gamepadHub: GamepadHub = {
  getGamepads: () => [],
}
const pointerLock: PointerLock = {
  pointerLockElement: null,
}
const pointerEventPub: PointerEventPub = {
  addEventListener() {},
  removeEventListener() {},
  requestPointerLock() {},
}
const security: SecureContext = {
  isSecureContext: false,
}

Deno.test('Buttons are initially inactive.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
  input.register('add')
  input.preupdate()
  assertEquals(input.isOn('Up'), false)
  assertEquals(input.isOnStart('Up'), false)
  assertEquals(input.isOnHeld('Up'), false)
  assertEquals(input.isOff('Up'), true)
  assertEquals(input.isOffStart('Up'), false)
  assertEquals(input.isOffHeld('Up'), false)
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isComboStart(['Up']), false)
  assertEquals(input.isComboHeld(['Up']), false)
  input.register('remove')
})

Deno.test('Pressed buttons are active and triggered.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.preupdate()
  assertEquals(input.isOn('Up'), true)
  assertEquals(input.isOnStart('Up'), true)
  assertEquals(input.isOnHeld('Up'), false)
  assertEquals(input.isOff('Up'), false)
  assertEquals(input.isOffStart('Up'), false)
  assertEquals(input.isOffHeld('Up'), false)
  assertEquals(input.isCombo(['Up']), true)
  assertEquals(input.isComboStart(['Up']), true)
  assertEquals(input.isComboHeld(['Up']), false)
  input.register('remove')
})

Deno.test('Held buttons are active but not triggered.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
    16,
  )
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.preupdate()
  input.postupdate(16)
  input.preupdate()
  assertEquals(input.isOn('Up'), true)
  assertEquals(input.isOnStart('Up'), false)
  assertEquals(input.isOnHeld('Up'), true)
  assertEquals(input.isOff('Up'), false)
  assertEquals(input.isOffStart('Up'), false)
  assertEquals(input.isOffHeld('Up'), false)
  assertEquals(input.isCombo(['Up']), true)
  assertEquals(input.isComboStart(['Up']), false)
  assertEquals(input.isComboHeld(['Up']), true)
  input.register('remove')
})

Deno.test('Releases buttons are off and triggered.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  input.preupdate()
  input.postupdate(16)

  dispatchKeyEvent('keyup', 'ArrowUp')
  input.preupdate()

  assertEquals(input.isOn('Up'), false)
  assertEquals(input.isOnStart('Up'), false)
  assertEquals(input.isOnHeld('Up'), false)
  assertEquals(input.isOff('Up'), true)
  assertEquals(input.isOffStart('Up'), true)
  assertEquals(input.isOffHeld('Up'), false)
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isComboStart(['Up']), false)
  assertEquals(input.isComboHeld(['Up']), false)

  input.register('remove')
})

Deno.test('Combos are exact in length.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), true)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Up'], ['Down']), true)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Right']), false)
  assertEquals(input.isCombo(['Down'], ['Right']), false)
  assertEquals(input.isCombo(['Up'], ['Down'], ['Right']), true)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowRight')

  input.register('remove')
})

Deno.test('Simultaneously pressed buttons are active and triggered.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
  input.register('add')
  dispatchKeyEvent('keydown', 'ArrowUp')
  dispatchKeyEvent('keydown', 'ArrowDown')
  input.preupdate()

  assertEquals(input.isOn('Up', 'Down'), true)
  assertEquals(input.isOnStart('Up', 'Down'), true)
  assertEquals(input.isOnHeld('Up', 'Down'), false)
  assertEquals(input.isOff('Up', 'Down'), false)
  assertEquals(input.isOffStart('Up', 'Down'), false)
  assertEquals(input.isOffHeld('Up', 'Down'), false)

  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isComboStart(['Up']), false)
  assertEquals(input.isComboHeld(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isComboStart(['Down']), false)
  assertEquals(input.isComboHeld(['Down']), false)
  assertEquals(input.isCombo(['Up', 'Down']), true)
  assertEquals(input.isComboStart(['Up', 'Down']), true)
  assertEquals(input.isComboHeld(['Up', 'Down']), false)

  input.register('remove')
})

Deno.test('Combos buttons are exact.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), true)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  dispatchKeyEvent('keydown', 'ArrowLeft')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Up'], ['Down']), false)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowDown')
  dispatchKeyEvent('keyup', 'ArrowLeft')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Right']), false)
  assertEquals(input.isCombo(['Down'], ['Right']), false)
  assertEquals(input.isCombo(['Up'], ['Down'], ['Right']), false)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowRight')

  input.register('remove')
})

Deno.test('A long combo is active and triggered.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
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
    input.preupdate()
    if (i === (keys.length - 1)) break
    input.postupdate(16)

    dispatchKeyEvent('keyup', key)
    input.preupdate()
    input.postupdate(16)
  }

  const combo = keys.map((key) => [key.replace('Arrow', '') as Button])
  assertEquals(input.isCombo(...combo), true)
  assertEquals(input.isComboStart(...combo), true)
  assertEquals(input.isComboHeld(...combo), false)

  input.register('remove')
})

Deno.test('Around-the-world combo is active and triggered.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
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
    input.preupdate()
    if (i === (keyCombo.length - 1)) break
    input.postupdate(16)

    for (const button of buttons) {
      dispatchKeyEvent('keyup', button)
    }
    input.preupdate()
    input.postupdate(16)
  }

  const combo = keyCombo.map((
    keys,
  ) => keys.map((key) => key.replace('Arrow', '') as Button))
  assertEquals(input.isCombo(...combo), true)
  assertEquals(input.isComboStart(...combo), true)
  assertEquals(input.isComboHeld(...combo), false)

  input.register('remove')
})

Deno.test('Combo expired.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), true)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Up'], ['Down']), true)
  input.postupdate(1000)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Right']), false)
  assertEquals(input.isCombo(['Down'], ['Right']), false)
  assertEquals(input.isCombo(['Up'], ['Down'], ['Right']), false)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowRight')

  input.register('remove')
})

Deno.test('Long-pressed combo is active and held.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), true)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Up'], ['Down']), true)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Right']), false)
  assertEquals(input.isCombo(['Down'], ['Right']), false)
  assertEquals(input.isCombo(['Up'], ['Down'], ['Right']), true)
  input.postupdate(1000)

  input.preupdate()
  assertEquals(input.isCombo(['Up'], ['Down'], ['Right']), true)
  assertEquals(input.isComboHeld(['Up'], ['Down'], ['Right']), true)

  input.register('remove')
})

Deno.test('Combo after long-pressed combo is active.', () => {
  const input = new Input(
    cam,
    gamepadHub,
    globalThis,
    pointerLock,
    pointerEventPub,
    security,
  )
  input.register('add')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), true)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowUp')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Up'], ['Down']), true)
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowRight')
  input.preupdate()
  assertEquals(input.isCombo(['Up']), false)
  assertEquals(input.isCombo(['Down']), false)
  assertEquals(input.isCombo(['Right']), false)
  assertEquals(input.isCombo(['Down'], ['Right']), false)
  assertEquals(input.isCombo(['Up'], ['Down'], ['Right']), true)
  input.postupdate(1000)
  dispatchKeyEvent('keyup', 'ArrowRight')

  input.preupdate()
  input.postupdate(16)

  dispatchKeyEvent('keydown', 'ArrowLeft')
  input.preupdate()
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowLeft')

  dispatchKeyEvent('keydown', 'ArrowDown')
  input.preupdate()
  input.postupdate(16)
  dispatchKeyEvent('keyup', 'ArrowDown')

  dispatchKeyEvent('keydown', 'ArrowUp')
  input.preupdate()
  input.postupdate(16)

  assertEquals(input.isCombo(['Left'], ['Down'], ['Up']), true)

  input.register('remove')
})

function dispatchKeyEvent(type: 'keydown' | 'keyup', key: string): void {
  globalThis.dispatchEvent(Object.assign(new CustomEvent(type), { key }))
}
