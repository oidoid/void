import { assertEquals } from '@std/assert'
import { type Combo, type DefaultButton, DefaultInput } from './input.ts'
import { Cam } from '../cam.ts'
import {
  KeyTestEvent,
  PointerTestEvent
} from '../test/test-event.ts'

globalThis.devicePixelRatio = 1
globalThis.isSecureContext = false

Deno.test('init', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('no update', () => {
    assertEquals(input.handled, false)
    assertEquals(input.gestured, false)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'Off')
    assertCombo(input, [['U']], 'Unequal')
  })

  await test.step('no change after update', () => {
    input.update(16)

    assertEquals(input.handled, false)
    assertEquals(input.gestured, false)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'Off')
    assertCombo(input, [['U']], 'Unequal')
  })
})

Deno.test('held off', () => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  input.update(input.maxIntervalMillis + 1)

  assertEquals(input.gestured, false)
  assertEquals(input.isHeld(), true)
  assertButton(input, 'U', 'Off')
  assertCombo(input, [['U']], 'Unequal')
})

Deno.test('pressed buttons', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('pressed are active and triggered', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
  })

  await test.step('unpressed are inactive and not triggered', () => {
    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'D', 'Off')
    assertCombo(input, [['D']], 'Unequal')
    assertCombo(input, [['D', 'U']], 'Unequal')
    assertCombo(input, [['D'], ['U']], 'Unequal')
  })

  await test.step('pressed are triggered for one frame only', () => {
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'On')
    assertCombo(input, [['U']], 'Equal')
  })

  await test.step('released are off and triggered', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'Off', 'Start')
    assertCombo(input, [['U']], 'Unequal')
  })

  await test.step('pressed are held on', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(input.minHeldMillis)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
  })

  await test.step('expired allow current combo to stay on but discontinue next', () => {
    input.update(input.maxIntervalMillis + 1)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), true)
    assertButton(input, 'U', 'On')
    assertCombo(input, [['U']], 'EndsWith')
    assertCombo(input, [['U'], ['U']], 'Equal')
  })

  await test.step('expired start new combo', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U']], 'Unequal')
  })
})

// in A, A+B, you cannot slide from A to B without a release.
Deno.test('combos require releases between presses', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['D'], ['U']], 'Unequal')
  })

  await test.step('Up, Down', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowDown'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['D']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['D'], ['U']], 'Unequal')
  })

  await test.step('Up, Down, Up', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowDown'}))
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['D'], ['U']], 'Unequal')
  })
})

Deno.test('around-the-world combo', () => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  const sets = [
    ['ArrowUp'],
    ['ArrowUp', 'ArrowRight'],
    ['ArrowRight'],
    ['ArrowRight', 'ArrowDown'],
    ['ArrowDown'],
    ['ArrowDown', 'ArrowLeft'],
    ['ArrowLeft'],
    ['ArrowUp', 'ArrowLeft']
  ]
  for (const set of sets) {
    input.update(16)
    for (const key of set) target.dispatchEvent(KeyTestEvent('keydown', {key}))
    input.update(16)
    for (const key of set) target.dispatchEvent(KeyTestEvent('keyup', {key}))
  }

  assertCombo(
    input,
    [['U'], ['U', 'R'], ['R'], ['D', 'R'], ['D'], ['D', 'L'], ['L'], [
      'U',
      'L'
    ]],
    'Equal',
    'Start'
  )
})

Deno.test('Up, Up, Down, Down, Left', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  await test.step('Up, Up', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  await test.step('Up, Up, Down', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowDown'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  await test.step('Up, Up, Down, Down', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowDown'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowDown'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  await test.step('Up, Up, Down, Down, Left', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowDown'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowLeft'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'Off')
    assertButton(input, 'L', 'On', 'Start')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Equal', 'Start')
  })
})

Deno.test('held combos stay active past expiry', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('Up, Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
  })

  await test.step('held', () => {
    input.update(input.maxIntervalMillis + 1)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), true)
    assertButton(input, 'U', 'On')
    assertCombo(input, [['U']], 'EndsWith')
    assertCombo(input, [['U'], ['U']], 'Equal')
  })
})

Deno.test('combo sequences can have multiple buttons', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('Up Left', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowLeft'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertButton(input, 'L', 'On', 'Start')
    assertButton(input, 'R', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['D']], 'Unequal')
    assertCombo(input, [['L']], 'Unequal')
    assertCombo(input, [['R']], 'Unequal')
    assertCombo(input, [['U', 'L']], 'Equal', 'Start')
    assertCombo(input, [['D', 'R']], 'Unequal')
    assertCombo(input, [['U', 'L'], ['D', 'R']], 'Unequal')
  })

  await test.step('Up Left, Down Right', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowUp'}))
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowLeft'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowDown'}))
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowRight'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertButton(input, 'L', 'Off')
    assertButton(input, 'R', 'On', 'Start')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['D']], 'Unequal')
    assertCombo(input, [['L']], 'Unequal')
    assertCombo(input, [['R']], 'Unequal')
    assertCombo(input, [['U', 'L']], 'Unequal')
    assertCombo(input, [['D', 'R']], 'EndsWith', 'Start')
    assertCombo(input, [['U', 'L'], ['D', 'R']], 'Equal', 'Start')
  })
})

Deno.test('handled', () => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  assertEquals(input.gestured, false)
  assertEquals(input.isHeld(), false)

  assertButton(input, 'U', 'Off')
  assertCombo(input, [['U']], 'Unequal')

  input.handled = true

  assertEquals(input.gestured, false)
  assertEquals(input.isHeld(), false)

  assertEquals(input.isAnyStart('U'), false)
  assertEquals(input.isAnyOn('U'), false)
  assertEquals(input.isAnyOnStart('U'), false)
  assertEquals(input.isOn('U'), false)
  assertEquals(input.isOnStart('U'), false)
  assertEquals(input.isOff('U'), false)
  assertEquals(input.isOffStart('U'), false)

  assertEquals(input.isComboEndsWith(['U']), false)
  assertEquals(input.isComboEndsWithStart(['U']), false)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isComboStart(['U']), false)

  target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
  input.update(input.minHeldMillis)

  assertEquals(input.gestured, true)
  assertEquals(input.isHeld(), true)

  assertButton(input, 'U', 'On', 'Start')
  assertCombo(input, [['U']], 'Equal', 'Start')

  input.handled = true

  assertEquals(input.gestured, true)
  assertEquals(input.isHeld(), false)

  assertEquals(input.isAnyStart('U'), false)
  assertEquals(input.isAnyOn('U'), false)
  assertEquals(input.isAnyOnStart('U'), false)
  assertEquals(input.isOn('U'), false)
  assertEquals(input.isOnStart('U'), false)
  assertEquals(input.isOff('U'), false)
  assertEquals(input.isOffStart('U'), false)

  assertEquals(input.isComboEndsWith(['U']), false)
  assertEquals(input.isComboEndsWithStart(['U']), false)
  assertEquals(input.isCombo(['U']), false)
  assertEquals(input.isComboStart(['U']), false)
})

Deno.test('isAny', () => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
  input.update(16)

  assertEquals(input.isAnyStart('U'), true)
  assertEquals(input.isAnyOn('U'), true)
  assertEquals(input.isAnyOnStart('U'), true)

  assertEquals(input.isAnyStart('U', 'D'), true)
  assertEquals(input.isAnyOn('U', 'D'), true)
  assertEquals(input.isAnyOnStart('U', 'D'), true)

  assertEquals(input.isAnyStart('D'), false)
  assertEquals(input.isAnyOn('D'), false)
  assertEquals(input.isAnyOnStart('D'), false)

  assertEquals(input.isAnyStart('D', 'R'), false)
  assertEquals(input.isAnyOn('D', 'R'), false)
  assertEquals(input.isAnyOnStart('D', 'R'), false)
})

// to-do: pointer tests.

function assertButton(
  input: DefaultInput,
  btn: DefaultButton,
  state: 'On' | 'Off',
  edge?: 'Start'
): void {
  assertEquals(input.isAnyStart(btn), edge === 'Start')
  assertEquals(input.isAnyOn(btn), state === 'On')
  assertEquals(input.isAnyOnStart(btn), state === 'On' && edge === 'Start')
  assertEquals(input.isOn(btn), state === 'On')
  assertEquals(input.isOnStart(btn), state === 'On' && edge === 'Start')
  assertEquals(input.isOff(btn), state === 'Off')
  assertEquals(input.isOffStart(btn), state === 'Off' && edge === 'Start')
}

function assertCombo(
  input: DefaultInput,
  combo: Readonly<Combo<DefaultButton>>,
  state: 'EndsWith' | 'Equal' | 'Unequal',
  edge?: 'Start'
): void {
  assertEquals(input.isComboEndsWith(...combo), state !== 'Unequal')
  assertEquals(
    input.isComboEndsWithStart(...combo),
    state !== 'Unequal' && edge === 'Start'
  )
  assertEquals(input.isCombo(...combo), state === 'Equal')
  assertEquals(
    input.isComboStart(...combo),
    state === 'Equal' && edge === 'Start'
  )
}

function DefaultCam(): Cam {
  const cam = new Cam()
  cam.clientWH = {w: 1000, h: 1000}
  return cam
}
