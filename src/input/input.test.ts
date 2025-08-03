import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Cam} from '../cam.ts'
import {TestElement} from '../test/test-element.ts'
import {
  KeyTestEvent,
  PointerTestEvent,
  WheelTestEvent
} from '../test/test-event.ts'
import {type Combo, type DefaultButton, DefaultInput} from './input.ts'

globalThis.devicePixelRatio = 1
globalThis.isSecureContext = false

test('init', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('no update', () => {
    assert.equal(input.handled, false)
    assert.equal(input.invalid, false)
    assert.equal(input.gestured, false)
    assert.equal(input.held, false)
    assert.equal(input.started, false)
    assertButton(input, 'U', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assert.deepEqual(input.point, undefined)
    assert.deepEqual(input.wheel, undefined)
  })

  ctx.test('no change after update', () => {
    input.update(16)

    assert.equal(input.handled, false)
    assert.equal(input.invalid, false)
    assert.equal(input.gestured, false)
    assert.equal(input.held, false)
    assert.equal(input.started, false)
    assertButton(input, 'U', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assert.deepEqual(input.point, undefined)
    assert.deepEqual(input.wheel, undefined)
  })
})

test('held off', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  input.update(input.comboMaxIntervalMillis + 1)

  assert.equal(input.invalid, false)
  assert.equal(input.gestured, false)
  assert.equal(input.held, true)
  assert.equal(input.started, false)
  assertButton(input, 'U', 'Off')
  assertCombo(input, [['U']], 'Unequal')
})

test('pressed buttons', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('pressed are active and triggered', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
  })

  ctx.test('unpressed are inactive and not triggered', () => {
    assertButton(input, 'D', 'Off')
    assertCombo(input, [['D']], 'Unequal')
    assertCombo(input, [['D', 'U']], 'Unequal')
    assertCombo(input, [['D'], ['U']], 'Unequal')
  })

  ctx.test('pressed are triggered for one frame only', () => {
    input.update(16)

    assert.equal(input.invalid, false)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, false)
    assertButton(input, 'U', 'On')
    assertCombo(input, [['U']], 'Equal')
  })

  ctx.test('released are off and triggered', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'Off', 'Start')
    assertCombo(input, [['U']], 'Unequal')
  })

  ctx.test('pressed are held on', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(input.minHeldMillis)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, true)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
  })

  ctx.test(
    'expired allow current combo to stay on but discontinue next',
    () => {
      input.update(input.comboMaxIntervalMillis + 1)

      assert.equal(input.invalid, false)
      assert.equal(input.gestured, true)
      assert.equal(input.held, true)
      assert.equal(input.started, false)
      assertButton(input, 'U', 'On')
      assertCombo(input, [['U']], 'EndsWith')
      assertCombo(input, [['U'], ['U']], 'Equal')
    }
  )

  ctx.test('expired start new combo', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U']], 'Unequal')
  })
})

// for "A, A+B", you can slide from A to B without a release.
test("combos don't require gaps between presses", async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['D'], ['U']], 'Unequal')
  })

  ctx.test('Up, Down', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['D']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['D'], ['U']], 'Unequal')
  })

  ctx.test('Up, Down, Up', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowDown'}))
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['D'], ['U']], 'Equal', 'Start')
  })
})

test('around-the-world combo', () => {
  const target = TestElement()
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
    for (const code of set)
      target.dispatchEvent(KeyTestEvent('keydown', {code}))
    input.update(16)
    for (const code of set) target.dispatchEvent(KeyTestEvent('keyup', {code}))
  }

  assertCombo(
    input,
    [
      ['U'],
      ['U', 'R'],
      ['R'],
      ['D', 'R'],
      ['D'],
      ['D', 'L'],
      ['L'],
      ['U', 'L']
    ],
    'Equal',
    'Start'
  )
})

test('Up, Up, Down, Down, Left', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  ctx.test('Up, Up', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  ctx.test('Up, Up, Down', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  ctx.test('Up, Up, Down, Down', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowDown'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  ctx.test('Up, Up, Down, Down, Left', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowDown'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowLeft'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
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

test('held combos stay active past expiry', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('Up, Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
  })

  ctx.test('held', () => {
    input.update(input.comboMaxIntervalMillis + 1)

    assert.equal(input.invalid, false)
    assert.equal(input.gestured, true)
    assert.equal(input.held, true)
    assert.equal(input.started, false)
    assertButton(input, 'U', 'On')
    assertCombo(input, [['U']], 'EndsWith')
    assertCombo(input, [['U'], ['U']], 'Equal')
  })
})

test('combo sequences can have multiple buttons', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('Up Left', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowLeft'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
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
    assertCombo(
      input,
      [
        ['U', 'L'],
        ['D', 'R']
      ],
      'Unequal'
    )
  })

  ctx.test('Up Left, Down Right', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowLeft'}))
    input.update(16)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowRight'}))
    input.update(16)

    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
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
    assertCombo(
      input,
      [
        ['U', 'L'],
        ['D', 'R']
      ],
      'Equal',
      'Start'
    )
  })
})

test('handled', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  assert.equal(input.invalid, false)
  assert.equal(input.gestured, false)
  assert.equal(input.held, false)
  assert.equal(input.started, false)

  assertButton(input, 'U', 'Off')
  assertCombo(input, [['U']], 'Unequal')

  input.handled = true

  assert.equal(input.invalid, false)
  assert.equal(input.gestured, false)
  assert.equal(input.held, false)
  assert.equal(input.started, false)

  assert.equal(input.isAnyOn('U'), false)
  assert.equal(input.isAnyOnStart('U'), false)
  assert.equal(input.isOn('U'), false)
  assert.equal(input.isOnStart('U'), false)
  assert.equal(input.isOff('U'), false)
  assert.equal(input.isOffStart('U'), false)

  assert.equal(input.isComboEndsWith(['U']), false)
  assert.equal(input.isComboEndsWithStart(['U']), false)
  assert.equal(input.isCombo(['U']), false)
  assert.equal(input.isComboStart(['U']), false)

  target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
  input.update(input.minHeldMillis)

  assert.equal(input.invalid, true)
  assert.equal(input.gestured, true)
  assert.equal(input.held, true)
  assert.equal(input.started, true)

  assertButton(input, 'U', 'On', 'Start')
  assertCombo(input, [['U']], 'Equal', 'Start')

  input.handled = true

  assert.equal(input.invalid, true)
  assert.equal(input.gestured, true)
  assert.equal(input.held, false)
  assert.equal(input.started, false)

  assert.equal(input.isAnyOn('U'), false)
  assert.equal(input.isAnyOnStart('U'), false)
  assert.equal(input.isOn('U'), false)
  assert.equal(input.isOnStart('U'), false)
  assert.equal(input.isOff('U'), false)
  assert.equal(input.isOffStart('U'), false)

  assert.equal(input.isComboEndsWith(['U']), false)
  assert.equal(input.isComboEndsWithStart(['U']), false)
  assert.equal(input.isCombo(['U']), false)
  assert.equal(input.isComboStart(['U']), false)
})

test('isAny', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
  input.update(16)

  assert.equal(input.started, true)

  assert.equal(input.isAnyOn('U'), true)
  assert.equal(input.isAnyOnStart('U'), true)

  assert.equal(input.isAnyOn('U', 'D'), true)
  assert.equal(input.isAnyOnStart('U', 'D'), true)

  assert.equal(input.isAnyOn('D'), false)
  assert.equal(input.isAnyOnStart('D'), false)

  assert.equal(input.isAnyOn('D', 'R'), false)
  assert.equal(input.isAnyOnStart('D', 'R'), false)
})

test('isStart', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  assert.equal(input.started, false)

  target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
  input.update(16)

  assert.equal(input.started, true)

  input.update(16)
  assert.equal(input.started, false)

  target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
  input.update(16)

  assert.equal(input.started, true)
  input.update(16)

  assert.equal(input.started, false)
})

test('pointer movements update position', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {
        offsetX: 1,
        offsetY: 2
      })
    )
    input.update(16)

    assert.deepEqual(input.point?.client, {x: 1, y: 2})
    assert.deepEqual(input.point?.type, 'Mouse')
    assert.equal(input.point?.started, true)
  })

  ctx.test('and position is not lost on update', () => {
    input.update(16)

    assert.deepEqual(input.point?.client, {x: 1, y: 2})
    assert.deepEqual(input.point?.type, 'Mouse')
    assert.equal(input.point?.started, false)
  })
})

test('pointer clicks are buttons', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(
    PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
  )
  input.update(16)

  assertButton(input, 'Click', 'On', 'Start')
  assertCombo(input, [['Click']], 'Equal', 'Start')
  assert.equal(input.point?.started, true)
})

test('pointer secondary clicks are buttons', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(
    PointerTestEvent('pointerdown', {buttons: 2, offsetX: 1, offsetY: 2})
  )
  input.update(16)

  assertButton(input, 'Click2', 'On', 'Start')
  assertCombo(input, [['Click2']], 'Equal', 'Start')
  assert.equal(input.point?.started, true)
})

test('a pointer click can become a drag', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('init', () => {
    assert.deepEqual(input.point?.drag.on, undefined)
    assert.deepEqual(input.point?.drag.start, undefined)
    assert.deepEqual(input.point?.drag.end, undefined)
    assert.deepEqual(input.point?.click.xy, undefined)
    assert.equal(input.point?.started, undefined)
  })

  ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16)

    assertButton(input, 'Click', 'On', 'Start')
    assertCombo(input, [['Click']], 'Equal', 'Start')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.equal(input.point?.started, true)
  })

  ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, true)
    assert.deepEqual(input.point?.drag.start, true)
    assert.deepEqual(input.point?.drag.end, false)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.equal(input.point?.started, true)
  })

  ctx.test('pause', () => {
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, true)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.equal(input.point?.started, false)
  })

  ctx.test('move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 16, offsetY: 12})
    )
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, true)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.equal(input.point?.started, true)
  })

  ctx.test('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {}))
    input.update(16)

    assertButton(input, 'Click', 'Off', 'Start')
    assertCombo(input, [['Click']], 'Unequal')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, true)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.equal(input.point?.started, true)
  })

  ctx.test('pause again', () => {
    input.update(16)

    assertButton(input, 'Click', 'Off')
    assertCombo(input, [['Click']], 'Unequal')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.equal(input.point?.started, false)
  })
})

test('a pointer click can become a drag or a pinch', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('init', () => {
    assert.deepEqual(input.point?.drag.on, undefined)
    assert.deepEqual(input.point?.drag.start, undefined)
    assert.deepEqual(input.point?.drag.end, undefined)
    assert.deepEqual(input.point?.click.xy, undefined)
    assert.deepEqual(input.point?.pinch.xy, undefined)
    assert.deepEqual(input.point?.center.xy, undefined)
    assert.equal(input.point?.started, undefined)
  })

  ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16)

    assertButton(input, 'Click', 'On', 'Start')
    assertCombo(input, [['Click']], 'Equal', 'Start')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.deepEqual(input.point?.pinch.xy, {x: 0, y: 0})
    assert.deepEqual(input.point?.center.xy, {x: 1, y: 2})
    assert.equal(input.point?.started, true)
  })

  ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, true)
    assert.deepEqual(input.point?.drag.start, true)
    assert.deepEqual(input.point?.drag.end, false)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.deepEqual(input.point?.pinch.xy, {x: 0, y: 0})
    assert.deepEqual(input.point?.center.xy, {x: 6, y: 2})
    assert.equal(input.point?.started, true)
  })

  ctx.test('pinch', () => {
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
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, true)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.deepEqual(input.point?.pinch.xy, {x: 0, y: 0})
    assert.deepEqual(input.point?.center.xy, {x: 8, y: 6})
    assert.equal(input.point?.started, true)
  })

  ctx.test('expand', () => {
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
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.deepEqual(input.point?.click.xy, {x: 1, y: 2})
    assert.deepEqual(input.point?.pinch.xy, {x: 10, y: 10})
    assert.deepEqual(input.point?.center.xy, {x: 13, y: 11})
    assert.equal(input.point?.started, true)
  })
})

test('center', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('init', () => assert.deepEqual(input.point?.center.xy, undefined))

  ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16)

    assert.deepEqual(input.point?.center.xy, {x: 1, y: 2})
    assert.equal(input.point?.started, true)
  })

  ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    input.update(16)

    assert.deepEqual(input.point?.center.xy, {x: 10, y: 10})
    assert.equal(input.point?.started, true)
  })

  ctx.test('secondary click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 20,
        offsetY: 20,
        pointerId: 2
      })
    )
    input.update(16)

    assert.deepEqual(input.point?.center.xy, {x: 15, y: 15})
    assert.equal(input.point?.started, true)
  })

  ctx.test('primary unclick', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerup', {offsetX: 30, offsetY: 30})
    )
    input.update(16)

    assert.deepEqual(input.point?.center.xy, {x: 20, y: 20})
    assert.equal(input.point?.started, true)
  })
})

test('pinch', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('init', () => {
    assert.deepEqual(input.point?.center.xy, undefined)
    assert.deepEqual(input.point?.pinch, undefined)
    assert.equal(input.point?.started, undefined)
  })

  ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    input.update(16)

    assert.deepEqual(input.point?.center.xy, {x: 10, y: 10})
    assert.deepEqual(input.point?.pinch.xy, {x: 0, y: 0})
    assert.equal(input.point?.started, true)
  })

  ctx.test('secondary click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 20,
        offsetY: 20,
        pointerId: 2
      })
    )
    input.update(16)

    assert.deepEqual(input.point?.center.xy, {x: 15, y: 15})
    assert.deepEqual(input.point?.pinch.xy, {x: 0, y: 0})
    assert.equal(input.point?.started, true)
  })

  ctx.test('expand', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {
        buttons: 1,
        offsetX: 30,
        offsetY: 30,
        pointerId: 2
      })
    )
    input.update(16)

    assert.deepEqual(input.point?.center.xy, {x: 20, y: 20})
    assert.deepEqual(input.point?.pinch.xy, {x: 10, y: 10})
    assert.equal(input.point?.started, true)
  })

  ctx.test('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {pointerId: 2}))
    input.update(16)

    assert.deepEqual(input.point?.center.xy, {x: 10, y: 10})
    assert.deepEqual(input.point?.pinch.xy, {x: 0, y: 0})
    assert.equal(input.point?.started, true)
  })
})

test('wheel', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
  input.update(16)

  assert.deepEqual(input.wheel?.delta.client, {x: 1, y: 2, z: 3})
  assert.deepEqual(input.wheel?.delta.xy, {x: 1, y: 2})
})

function assertButton(
  input: DefaultInput<DefaultButton>,
  btn: DefaultButton,
  state: 'On' | 'Off',
  edge?: 'Start'
): void {
  assert.equal(input.isAnyOn(btn), state === 'On')
  assert.equal(input.isAnyOnStart(btn), state === 'On' && edge === 'Start')
  assert.equal(input.isOn(btn), state === 'On')
  assert.equal(input.isOnStart(btn), state === 'On' && edge === 'Start')
  assert.equal(input.isOff(btn), state === 'Off')
  assert.equal(input.isOffStart(btn), state === 'Off' && edge === 'Start')
}

function assertCombo(
  input: DefaultInput<DefaultButton>,
  combo: Readonly<Combo<DefaultButton>>,
  state: 'EndsWith' | 'Equal' | 'Unequal',
  edge?: 'Start'
): void {
  assert.equal(input.isComboEndsWith(...combo), state !== 'Unequal')
  assert.equal(
    input.isComboEndsWithStart(...combo),
    state !== 'Unequal' && edge === 'Start'
  )
  assert.equal(input.isCombo(...combo), state === 'Equal')
  assert.equal(
    input.isComboStart(...combo),
    state === 'Equal' && edge === 'Start'
  )
}

function DefaultCam(): Cam {
  const cam = new Cam()
  cam.whClient = {w: 1000, h: 1000}
  return cam
}
