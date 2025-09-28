import assert from 'node:assert/strict'
import {afterEach, beforeEach, test} from 'node:test'
import {Cam} from '../graphics/cam.ts'
import {TestElement} from '../test/test-element.ts'
import {
  KeyTestEvent,
  PointerTestEvent,
  WheelTestEvent
} from '../test/test-event.ts'
import type {Millis} from '../types/time.ts'
import {type Combo, type DefaultButton, Input} from './input.ts'

beforeEach(() => {
  globalThis.devicePixelRatio = 1
  globalThis.isSecureContext = false
  globalThis.addEventListener = () => {}
  globalThis.removeEventListener = () => {}
})

afterEach(() => {
  delete (globalThis as Partial<typeof globalThis>).devicePixelRatio
  delete (globalThis as Partial<typeof globalThis>).isSecureContext
  delete (globalThis as Partial<typeof globalThis>).addEventListener
  delete (globalThis as Partial<typeof globalThis>).removeEventListener
})

test('init', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('no update', () => {
    assert.deepEqual(input.on, [])
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
    input.update(16 as Millis)

    assert.deepEqual(input.on, [])
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

  input.update((input.comboMaxIntervalMillis + 1) as Millis)

  assert.deepEqual(input.on, [])
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
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['U'])
    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assert.deepEqual(input.combo, [['U']])
  })

  ctx.test('unpressed are inactive and not triggered', () => {
    assertButton(input, 'D', 'Off')
    assertCombo(input, [['D']], 'Unequal')
    assertCombo(input, [['D', 'U']], 'Unequal')
    assertCombo(input, [['D'], ['U']], 'Unequal')
  })

  ctx.test('pressed are triggered for one frame only', () => {
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['U'])
    assert.equal(input.invalid, false)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, false)
    assertButton(input, 'U', 'On')
    assertCombo(input, [['U']], 'Equal')
    assert.deepEqual(input.combo, [['U']])
  })

  ctx.test('released are off and triggered', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, [])
    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'Off', 'Start')
    assertCombo(input, [['U']], 'Equal')
    assert.deepEqual(input.combo, [['U']])
  })

  ctx.test('pressed are held on', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(input.minHeldMillis)

    assert.deepEqual(input.on, ['U'])
    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, true)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
    assert.deepEqual(input.combo, [['U'], ['U']])
  })

  ctx.test(
    'expired allow current combo to stay on but discontinue next',
    () => {
      input.update((input.comboMaxIntervalMillis + 1) as Millis)

      assert.deepEqual(input.on, ['U'])
      assert.equal(input.invalid, false)
      assert.equal(input.gestured, true)
      assert.equal(input.held, true)
      assert.equal(input.started, false)
      assertButton(input, 'U', 'On')
      assertCombo(input, [['U']], 'EndsWith')
      assertCombo(input, [['U'], ['U']], 'Equal')
      assert.deepEqual(input.combo, [['U'], ['U']])
    }
  )

  ctx.test('expired start new combo', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['U'])
    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assert.deepEqual(input.combo, [['U']])
  })
})

// to-do: how can I make two button combos friendlier? this is impossible to
// time at the same time and it's unclear how to resolve within a window. all
// buttons pressed sounds good. even if I remove gap requirement, you end up
// pressing A, A+B, B instead of A+B. generate multiple interpretations each
// press and union result. for "A, A+B", you can't slide from A to B without a
// release and releasing buttons after "A, A+B, A+B+C" doesn't cause
// "A, A+B, A+B+C, B+C, C". my ideal is: new sequence after an off release,
// otherwise aggregate for like 60ms.
// A-off-A+B-off-A-off-A -> A-A+B-A-A
// A-off-A-B-off-A-off-A -> A-A+B-A-A, don't care if also A-A-B-A-A
// U-U+R-R-R+D-D-D+L-L-L+U -> U-U+R-R-R+D-D-D+L-L-L+U
test('combos require gaps between presses', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['U'])
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
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['D'])
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
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['U'])
    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['D'], ['U']], 'Unequal')
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
    input.update(16 as Millis)
    for (const code of set)
      target.dispatchEvent(KeyTestEvent('keydown', {code}))
    input.update(16 as Millis)
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
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['U'])
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
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['U'])
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
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['D'])
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
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['D'])
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
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowLeft'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['L'])
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
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['U'])
    assert.equal(input.invalid, true)
    assert.equal(input.gestured, true)
    assert.equal(input.held, false)
    assert.equal(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
  })

  ctx.test('held', () => {
    input.update((input.comboMaxIntervalMillis + 1) as Millis)

    assert.deepEqual(input.on, ['U'])
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
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['L', 'U'])
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
      [['U', 'L'], ['D', 'R']], // biome-ignore format:;
      'Unequal'
    )
  })

  ctx.test('Up Left, Down Right', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowLeft'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowRight'}))
    input.update(16 as Millis)

    assert.deepEqual(input.on, ['D', 'R'])
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
      [['U', 'L'], ['D', 'R']], // biome-ignore format:;
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

  assert.deepEqual(input.on, [])
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

  assert.deepEqual(input.on, ['U'])
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
  input.update(16 as Millis)

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
  input.update(16 as Millis)

  assert.equal(input.started, true)

  input.update(16 as Millis)
  assert.equal(input.started, false)

  target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
  input.update(16 as Millis)

  assert.equal(input.started, true)
  input.update(16 as Millis)

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
    input.update(16 as Millis)

    assert.deepEqual(input.point?.client, {x: 1, y: 2})
    assert.deepEqual(input.point?.type, 'Mouse')
    assert.equal(input.point?.invalid, true)
  })

  ctx.test('and position is not lost on update', () => {
    input.update(16 as Millis)

    assert.deepEqual(input.point?.client, {x: 1, y: 2})
    assert.deepEqual(input.point?.type, 'Mouse')
    assert.equal(input.point?.invalid, false)
  })
})

test('pointer clicks are buttons', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(
    PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
  )
  input.update(16 as Millis)

  assertButton(input, 'Click', 'On', 'Start')
  assertCombo(input, [['Click']], 'Equal', 'Start')
  assert.equal(input.point?.invalid, true)
})

test('pointer secondary clicks are buttons', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(
    PointerTestEvent('pointerdown', {buttons: 2, offsetX: 1, offsetY: 2})
  )
  input.update(16 as Millis)

  assertButton(input, 'Click2', 'On', 'Start')
  assertCombo(input, [['Click2']], 'Equal', 'Start')
  assert.equal(input.point?.invalid, true)
})

test('a pointer click can become a drag', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('init', () => {
    assert.deepEqual(input.point?.drag.on, undefined)
    assert.deepEqual(input.point?.drag.start, undefined)
    assert.deepEqual(input.point?.drag.end, undefined)
    assert.equal(input.point?.click, undefined)
    assert.equal(input.point?.invalid, undefined)
  })

  ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'Click', 'On', 'Start')
    assertCombo(input, [['Click']], 'Equal', 'Start')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert.equal(input.point?.invalid, true)
  })

  ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, true)
    assert.deepEqual(input.point?.drag.start, true)
    assert.deepEqual(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert.equal(input.point?.invalid, true)
  })

  ctx.test('pause', () => {
    input.update(16 as Millis)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, true)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert.equal(input.point?.invalid, false)
  })

  ctx.test('move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 16, offsetY: 12})
    )
    input.update(16 as Millis)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, true)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert.equal(input.point?.invalid, true)
  })

  ctx.test('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {}))
    input.update(16 as Millis)

    assertButton(input, 'Click', 'Off', 'Start')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, true)
    assert.partialDeepStrictEqual(input.point?.click, undefined)
    assert.equal(input.point?.invalid, true)
  })

  ctx.test('pause again', () => {
    input.update(16 as Millis)

    assertButton(input, 'Click', 'Off')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, undefined)
    assert.equal(input.point?.invalid, false)
  })
})

test('a pointer click can become a drag or a pinch', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('init', () => {
    assert.deepEqual(input.point?.drag.on, undefined)
    assert.deepEqual(input.point?.drag.start, undefined)
    assert.deepEqual(input.point?.drag.end, undefined)
    assert.partialDeepStrictEqual(input.point?.click, undefined)
    assert.deepEqual(input.point?.pinch?.xy, undefined)
    assert.equal(input.point?.center, undefined)
    assert.equal(input.point?.invalid, undefined)
  })

  ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'Click', 'On', 'Start')
    assertCombo(input, [['Click']], 'Equal', 'Start')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert.deepEqual(input.point?.pinch?.xy, undefined)
    assert.partialDeepStrictEqual(input.point?.center, {x: 1, y: 2})
    assert.equal(input.point?.invalid, true)
  })

  ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, true)
    assert.deepEqual(input.point?.drag.start, true)
    assert.deepEqual(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert.deepEqual(input.point?.pinch?.xy, undefined)
    assert.partialDeepStrictEqual(input.point?.center, {x: 6, y: 2})
    assert.equal(input.point?.invalid, true)
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
    input.update(16 as Millis)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, true)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert.deepEqual(input.point?.pinch?.xy, {x: 0, y: 0})
    assert.partialDeepStrictEqual(input.point?.center, {x: 8, y: 6})
    assert.equal(input.point?.invalid, true)
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
    input.update(16 as Millis)

    assertButton(input, 'Click', 'On')
    assertCombo(input, [['Click']], 'Equal')
    assert.deepEqual(input.point?.drag.on, false)
    assert.deepEqual(input.point?.drag.start, false)
    assert.deepEqual(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert.deepEqual(input.point?.pinch?.xy, {x: 10, y: 10})
    assert.partialDeepStrictEqual(input.point?.center, {x: 13, y: 11})
    assert.equal(input.point?.invalid, true)
  })
})

test('center', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('init', () =>
    assert.partialDeepStrictEqual(input.point?.center, undefined)
  )

  ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 1, y: 2})
    assert.equal(input.point?.invalid, true)
  })

  ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 10, y: 10})
    assert.equal(input.point?.invalid, true)
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
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 15, y: 15})
    assert.equal(input.point?.invalid, true)
  })

  ctx.test('primary unclick', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerup', {offsetX: 30, offsetY: 30})
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 20, y: 20})
    assert.equal(input.point?.invalid, true)
  })
})

test('pinch', async ctx => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  ctx.test('init', () => {
    assert.partialDeepStrictEqual(input.point?.center, undefined)
    assert.deepEqual(input.point?.pinch, undefined)
    assert.equal(input.point?.invalid, undefined)
  })

  ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 10, y: 10})
    assert.deepEqual(input.point?.pinch?.xy, undefined)
    assert.equal(input.point?.invalid, true)
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
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 15, y: 15})
    assert.deepEqual(input.point?.pinch?.xy, {x: 0, y: 0})
    assert.equal(input.point?.invalid, true)
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
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 20, y: 20})
    assert.deepEqual(input.point?.pinch?.xy, {x: 10, y: 10})
    assert.equal(input.point?.invalid, true)
  })

  ctx.test('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {pointerId: 2}))
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 10, y: 10})
    assert.deepEqual(input.point?.pinch?.xy, undefined)
    assert.equal(input.point?.invalid, true)
  })
})

test('wheel', () => {
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
  input.update(16 as Millis)

  assert.deepEqual(input.wheel?.delta.client, {x: 1, y: 2, z: 3})
  assert.deepEqual(input.wheel?.delta.xy, {x: 1, y: 2})
})

function assertButton(
  input: Input<DefaultButton>,
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
  input: Input<DefaultButton>,
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
  const abcCombo = combo.map(set => set.sort())
  if (state === 'Equal') assert.deepEqual(input.combo, abcCombo)
  else assert.notDeepEqual(input.combo, abcCombo)
}

function DefaultCam(): Cam {
  const cam = new Cam()
  // assume a fixed cam for all tests.
  cam.update({
    width: 0,
    height: 0,
    parentElement: {clientHeight: 1000, clientWidth: 1000},
    style: {width: '', height: ''}
  })
  return cam
}

function DefaultInput(
  cam: Readonly<Cam>,
  target: Element
): Input<DefaultButton> {
  return new Input<DefaultButton>(cam, target).mapDefault()
}
