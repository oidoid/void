import { assertEquals } from '@std/assert'
import { type Combo, type DefaultButton, DefaultInput } from './input.ts'
import { Cam } from '../cam.ts'
import {
  KeyTestEvent,
  PointerTestEvent,
  WheelTestEvent
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
    assertEquals(input.isStart(), false)
    assertButton(input, 'U', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assertEquals(input.point, undefined)
    assertEquals(input.wheel.delta, {
      xy: {x: 0, y: 0},
      client: {x: 0, y: 0, z: 0}
    })
  })

  await test.step('no change after update', () => {
    input.update(16)

    assertEquals(input.handled, false)
    assertEquals(input.gestured, false)
    assertEquals(input.isHeld(), false)
    assertEquals(input.isStart(), false)
    assertButton(input, 'U', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assertEquals(input.point, undefined)
    assertEquals(input.wheel.delta, {
      xy: {x: 0, y: 0},
      client: {x: 0, y: 0, z: 0}
    })
  })
})

Deno.test('held off', () => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  input.update(input.comboMaxIntervalMillis + 1)

  assertEquals(input.gestured, false)
  assertEquals(input.isHeld(), true)
  assertEquals(input.isStart(), false)
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
    assertEquals(input.isStart(), true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
  })

  await test.step('unpressed are inactive and not triggered', () => {
    assertButton(input, 'D', 'Off')
    assertCombo(input, [['D']], 'Unequal')
    assertCombo(input, [['D', 'U']], 'Unequal')
    assertCombo(input, [['D'], ['U']], 'Unequal')
  })

  await test.step('pressed are triggered for one frame only', () => {
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertEquals(input.isStart(), false)
    assertButton(input, 'U', 'On')
    assertCombo(input, [['U']], 'Equal')
  })

  await test.step('released are off and triggered', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertEquals(input.isStart(), true)
    assertButton(input, 'U', 'Off', 'Start')
    assertCombo(input, [['U']], 'Unequal')
  })

  await test.step('pressed are held on', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(input.minHeldMillis)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), true)
    assertEquals(input.isStart(), true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
  })

  await test.step('expired allow current combo to stay on but discontinue next', () => {
    input.update(input.comboMaxIntervalMillis + 1)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), true)
    assertEquals(input.isStart(), false)
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
    assertEquals(input.isStart(), true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U']], 'Unequal')
  })
})

// for "A, A+B", you can slide from A to B without a release.
Deno.test("combos don't require gaps between presses", async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
    input.update(16)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), false)
    assertEquals(input.isStart(), true)
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
    assertEquals(input.isStart(), true)
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
    assertEquals(input.isStart(), true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['D'], ['U']], 'Equal', 'Start')
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
    assertEquals(input.isStart(), true)
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
    assertEquals(input.isStart(), true)
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
    assertEquals(input.isStart(), true)
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
    assertEquals(input.isStart(), true)
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
    assertEquals(input.isStart(), true)
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
    assertEquals(input.isStart(), true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
  })

  await test.step('held', () => {
    input.update(input.comboMaxIntervalMillis + 1)

    assertEquals(input.gestured, true)
    assertEquals(input.isHeld(), true)
    assertEquals(input.isStart(), false)
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
    assertEquals(input.isStart(), true)
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
    assertEquals(input.isStart(), true)
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
  assertEquals(input.isStart(), false)

  assertButton(input, 'U', 'Off')
  assertCombo(input, [['U']], 'Unequal')

  input.handled = true

  assertEquals(input.gestured, false)
  assertEquals(input.isHeld(), false)
  assertEquals(input.isStart(), false)

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
  assertEquals(input.isStart(), true)

  assertButton(input, 'U', 'On', 'Start')
  assertCombo(input, [['U']], 'Equal', 'Start')

  input.handled = true

  assertEquals(input.gestured, true)
  assertEquals(input.isHeld(), false)
  assertEquals(input.isStart(), false)

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

  assertEquals(input.isStart(), true)

  assertEquals(input.isAnyOn('U'), true)
  assertEquals(input.isAnyOnStart('U'), true)

  assertEquals(input.isAnyOn('U', 'D'), true)
  assertEquals(input.isAnyOnStart('U', 'D'), true)

  assertEquals(input.isAnyOn('D'), false)
  assertEquals(input.isAnyOnStart('D'), false)

  assertEquals(input.isAnyOn('D', 'R'), false)
  assertEquals(input.isAnyOnStart('D', 'R'), false)
})

Deno.test('isStart', () => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  assertEquals(input.isStart(), false)

  target.dispatchEvent(KeyTestEvent('keydown', {key: 'ArrowUp'}))
  input.update(16)

  assertEquals(input.isStart(), true)

  input.update(16)
  assertEquals(input.isStart(), false)

  target.dispatchEvent(KeyTestEvent('keyup', {key: 'ArrowUp'}))
  input.update(16)

  assertEquals(input.isStart(), true)
  input.update(16)

  assertEquals(input.isStart(), false)
})

Deno.test('pointer movements update position', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {
        offsetX: 1,
        offsetY: 2
      })
    )
    input.update(16)

    assertEquals(input.point?.client, {x: 1, y: 2})
    assertEquals(input.point?.type, 'Mouse')
  })

  await test.step('and position is not lost on update', () => {
    input.update(16)

    assertEquals(input.point?.client, {x: 1, y: 2})
    assertEquals(input.point?.type, 'Mouse')
  })
})

Deno.test('pointer clicks are buttons', () => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(
    PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
  )
  input.update(16)

  assertButton(input, 'Click', 'On', 'Start')
  assertCombo(input, [['Click']], 'Equal', 'Start')
})

Deno.test('pointer secondary clicks are buttons', () => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(
    PointerTestEvent('pointerdown', {buttons: 2, offsetX: 1, offsetY: 2})
  )
  input.update(16)

  assertButton(input, 'Click2', 'On', 'Start')
  assertCombo(input, [['Click2']], 'Equal', 'Start')
})

Deno.test('a pointer click can become a drag', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('init', () => {
    assertEquals(input.point?.drag.on, undefined)
    assertEquals(input.point?.drag.start, undefined)
    assertEquals(input.point?.drag.end, undefined)
    assertEquals(input.point?.click.xy, undefined)
  })

  await test.step('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16)

    assertButton(input, 'Click', 'On', 'Start')
    assertCombo(input, [['Click']], 'Equal', 'Start')
    assertEquals(input.point?.drag.on, false)
    assertEquals(input.point?.drag.start, false)
    assertEquals(input.point?.drag.end, false)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
  })

  await test.step('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assertEquals(input.point?.drag.on, true)
    assertEquals(input.point?.drag.start, true)
    assertEquals(input.point?.drag.end, false)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
  })

  await test.step('pause', () => {
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assertEquals(input.point?.drag.on, true)
    assertEquals(input.point?.drag.start, false)
    assertEquals(input.point?.drag.end, false)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
  })

  await test.step('move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 16, offsetY: 12})
    )
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assertEquals(input.point?.drag.on, true)
    assertEquals(input.point?.drag.start, false)
    assertEquals(input.point?.drag.end, false)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
  })

  await test.step('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {}))
    input.update(16)

    assertButton(input, 'Click', 'Off', 'Start')
    assertCombo(input, [['Click']], 'Unequal')
    assertEquals(input.point?.drag.on, false)
    assertEquals(input.point?.drag.start, false)
    assertEquals(input.point?.drag.end, true)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
  })

  await test.step('pause again', () => {
    input.update(16)

    assertButton(input, 'Click', 'Off')
    assertCombo(input, [['Click']], 'Unequal')
    assertEquals(input.point?.drag.on, false)
    assertEquals(input.point?.drag.start, false)
    assertEquals(input.point?.drag.end, false)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
  })
})

Deno.test('a pointer click can become a drag or a pinch', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('init', () => {
    assertEquals(input.point?.drag.on, undefined)
    assertEquals(input.point?.drag.start, undefined)
    assertEquals(input.point?.drag.end, undefined)
    assertEquals(input.point?.click.xy, undefined)
    assertEquals(input.point?.pinch.xy, undefined)
    assertEquals(input.point?.center.xy, undefined)
  })

  await test.step('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16)

    assertButton(input, 'Click', 'On', 'Start')
    assertCombo(input, [['Click']], 'Equal', 'Start')
    assertEquals(input.point?.drag.on, false)
    assertEquals(input.point?.drag.start, false)
    assertEquals(input.point?.drag.end, false)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
    assertEquals(input.point?.pinch.xy, {x: 0, y: 0})
    assertEquals(input.point?.center.xy, {x: 1, y: 2})
  })

  await test.step('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assertEquals(input.point?.drag.on, true)
    assertEquals(input.point?.drag.start, true)
    assertEquals(input.point?.drag.end, false)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
    assertEquals(input.point?.pinch.xy, {x: 0, y: 0})
    assertEquals(input.point?.center.xy, {x: 6, y: 2})
  })

  await test.step('pinch', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 10,
        offsetY: 10,
        pointerId: 2
      })
    )
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assertEquals(input.point?.drag.on, false)
    assertEquals(input.point?.drag.start, false)
    assertEquals(input.point?.drag.end, true)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
    assertEquals(input.point?.pinch.xy, {x: 0, y: 0})
    assertEquals(input.point?.center.xy, {x: 8, y: 6})
  })

  await test.step('expand', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {
        buttons: 1,
        offsetX: 20,
        offsetY: 20,
        pointerId: 2
      })
    )
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assertEquals(input.point?.drag.on, false)
    assertEquals(input.point?.drag.start, false)
    assertEquals(input.point?.drag.end, false)
    assertEquals(input.point?.click.xy, {x: 1, y: 2})
    assertEquals(input.point?.pinch.xy, {x: 10, y: 10})
    assertEquals(input.point?.center.xy, {x: 13, y: 11})
  })
})

Deno.test('center', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('init', () => assertEquals(input.point?.center.xy, undefined))

  await test.step('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16)

    assertEquals(input.point?.center.xy, {x: 1, y: 2})
  })

  await test.step('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    input.update(16)

    assertEquals(input.point?.center.xy, {x: 10, y: 10})
  })

  await test.step('secondary click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 20,
        offsetY: 20,
        pointerId: 2
      })
    )
    input.update(16)

    assertEquals(input.point?.center.xy, {x: 15, y: 15})
  })

  await test.step('primary unclick', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerup', {offsetX: 30, offsetY: 30})
    )
    input.update(16)

    assertEquals(input.point?.center.xy, {x: 20, y: 20})
  })
})

Deno.test('pinch', async (test) => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await test.step('init', () => {
    assertEquals(input.point?.center.xy, undefined)
    assertEquals(input.point?.pinch, undefined)
  })

  await test.step('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    input.update(16)

    assertEquals(input.point?.center.xy, {x: 10, y: 10})
    assertEquals(input.point?.pinch.xy, {x: 0, y: 0})
  })

  await test.step('secondary click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 20,
        offsetY: 20,
        pointerId: 2
      })
    )
    input.update(16)

    assertEquals(input.point?.center.xy, {x: 15, y: 15})
    assertEquals(input.point?.pinch.xy, {x: 0, y: 0})
  })

  await test.step('expand', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {
        buttons: 1,
        offsetX: 30,
        offsetY: 30,
        pointerId: 2
      })
    )
    input.update(16)

    assertEquals(input.point?.center.xy, {x: 20, y: 20})
    assertEquals(input.point?.pinch.xy, {x: 10, y: 10})
  })

  await test.step('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {pointerId: 2}))
    input.update(16)

    assertEquals(input.point?.center.xy, {x: 10, y: 10})
    assertEquals(input.point?.pinch.xy, {x: 0, y: 0})
  })
})

Deno.test('wheel', () => {
  const target = new EventTarget()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
  input.update(16)

  assertEquals(input.wheel.delta.client, {x: 1, y: 2, z: 3})
  assertEquals(input.wheel.delta.xy, {x: 1, y: 2})
})

function assertButton(
  input: DefaultInput,
  btn: DefaultButton,
  state: 'On' | 'Off',
  edge?: 'Start'
): void {
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
  cam.whClient = {w: 1000, h: 1000}
  return cam
}
