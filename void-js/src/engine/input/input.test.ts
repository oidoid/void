import {afterEach, beforeEach, test} from 'node:test'
import {assert} from '../../test/assert.ts'
import {DevicePixelRatioMock} from '../../test/device-pixel-ratio-mock.ts'
import {SecureContextMock} from '../../test/secure-context-mock.ts'
import {TestElement} from '../../test/test-element.ts'
import {
  KeyTestEvent,
  PointerTestEvent,
  WheelTestEvent
} from '../../test/test-event.ts'
import {Cam} from '../graphics/cam.ts'
import type {Millis} from '../types/time.ts'
import {type AnyButton, type Combo, Input} from './input.ts'

beforeEach(() => {
  globalThis.addEventListener = () => {}
  globalThis.removeEventListener = () => {}
})

afterEach(() => {
  delete (globalThis as Partial<typeof globalThis>).addEventListener
  delete (globalThis as Partial<typeof globalThis>).removeEventListener
})

test('init', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('no update', () => {
    assert(input.on, [])
    assert(input.handled, false)
    assert(input.invalid, false)
    assert(input.gestured, false)
    assert(input.held, false)
    assert(input.started, false)
    assertButton(input, 'U', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assert(input.point, undefined)
    assert(input.wheel, undefined)
  })

  await ctx.test('no change after update', () => {
    input.update(16 as Millis)

    assert(input.on, [])
    assert(input.handled, false)
    assert(input.invalid, false)
    assert(input.gestured, false)
    assert(input.held, false)
    assert(input.started, false)
    assertButton(input, 'U', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assert(input.point, undefined)
    assert(input.wheel, undefined)
  })
})

test('held off', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  input.update((input.comboMaxIntervalMillis + 1) as Millis)

  assert(input.on, [])
  assert(input.invalid, false)
  assert(input.gestured, false)
  assert(input.held, true)
  assert(input.started, false)
  assertButton(input, 'U', 'Off')
  assertCombo(input, [['U']], 'Unequal')
})

test('pressed buttons', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('pressed are active and triggered', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert(input.on, ['U'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assert(input.combo, [['U']])
  })

  await ctx.test('unpressed are inactive and not triggered', () => {
    assertButton(input, 'D', 'Off')
    assertCombo(input, [['D']], 'Unequal')
    assertCombo(input, [['D', 'U']], 'Unequal')
    assertCombo(input, [['D'], ['U']], 'Unequal')
  })

  await ctx.test('pressed are triggered for one frame only', () => {
    input.update(16 as Millis)

    assert(input.on, ['U'])
    assert(input.invalid, false)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, false)
    assertButton(input, 'U', 'On')
    assertCombo(input, [['U']], 'Equal')
    assert(input.combo, [['U']])
  })

  await ctx.test('released are off and triggered', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert(input.on, [])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'Off', 'Start')
    assertCombo(input, [['U']], 'Equal')
    assert(input.combo, [['U']])
  })

  await ctx.test('pressed are held on', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(input.minHeldMillis)

    assert(input.on, ['U'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, true)
    assert(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
    assert(input.combo, [['U'], ['U']])
  })

  await ctx.test(
    'expired allow current combo to stay on but discontinue next',
    () => {
      input.update((input.comboMaxIntervalMillis + 1) as Millis)

      assert(input.on, ['U'])
      assert(input.invalid, false)
      assert(input.gestured, true)
      assert(input.held, true)
      assert(input.started, false)
      assertButton(input, 'U', 'On')
      assertCombo(input, [['U']], 'EndsWith')
      assertCombo(input, [['U'], ['U']], 'Equal')
      assert(input.combo, [['U'], ['U']])
    }
  )

  await ctx.test('expired start new combo', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert(input.on, ['U'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assert(input.combo, [['U']])
  })
})

test('combos require gaps between presses', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert(input.on, ['U'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['D'], ['U']], 'Unequal')
  })

  await ctx.test('Up, Down', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    input.update(16 as Millis)

    assert(input.on, ['D'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['D']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['D'], ['U']], 'Unequal')
  })

  await ctx.test('Up, Down, Up', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowDown'}))
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert(input.on, ['U'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off', 'Start')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['D'], ['U']], 'Unequal')
  })
})

test('around-the-world combo', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
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
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert(input.on, ['U'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  await ctx.test('Up, Up', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert(input.on, ['U'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertButton(input, 'D', 'Off')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  await ctx.test('Up, Up, Down', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    input.update(16 as Millis)

    assert(input.on, ['D'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  await ctx.test('Up, Up, Down, Down', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowDown'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    input.update(16 as Millis)

    assert(input.on, ['D'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'Off')
    assertButton(input, 'D', 'On', 'Start')
    assertButton(input, 'L', 'Off')
    assertCombo(input, [['U']], 'Unequal')
    assertCombo(input, [['U'], ['U']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D']], 'Unequal')
    assertCombo(input, [['U'], ['U'], ['D'], ['D']], 'Equal', 'Start')
    assertCombo(input, [['U'], ['U'], ['D'], ['D'], ['L']], 'Unequal')
  })

  await ctx.test('Up, Up, Down, Down, Left', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowDown'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowLeft'}))
    input.update(16 as Millis)

    assert(input.on, ['L'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
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
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('Up, Up', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    input.update(16 as Millis)

    assert(input.on, ['U'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
    assertButton(input, 'U', 'On', 'Start')
    assertCombo(input, [['U']], 'EndsWith', 'Start')
    assertCombo(input, [['U'], ['U']], 'Equal', 'Start')
  })

  await ctx.test('held', () => {
    input.update((input.comboMaxIntervalMillis + 1) as Millis)

    assert(input.on, ['U'])
    assert(input.invalid, false)
    assert(input.gestured, true)
    assert(input.held, true)
    assert(input.started, false)
    assertButton(input, 'U', 'On')
    assertCombo(input, [['U']], 'EndsWith')
    assertCombo(input, [['U'], ['U']], 'Equal')
  })
})

test('combo sequences can have multiple buttons', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('Up Left', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowLeft'}))
    input.update(16 as Millis)

    assert(input.on, ['L', 'U'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
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

  await ctx.test('Up Left, Down Right', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowLeft'}))
    input.update(16 as Millis)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowDown'}))
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowRight'}))
    input.update(16 as Millis)

    assert(input.on, ['D', 'R'])
    assert(input.invalid, true)
    assert(input.gestured, true)
    assert(input.held, false)
    assert(input.started, true)
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
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  assert(input.invalid, false)
  assert(input.gestured, false)
  assert(input.held, false)
  assert(input.started, false)

  assertButton(input, 'U', 'Off')
  assertCombo(input, [['U']], 'Unequal')

  input.handled = true

  assert(input.on, [])
  assert(input.invalid, false)
  assert(input.gestured, false)
  assert(input.held, false)
  assert(input.started, false)

  assert(input.isAnyOn('U'), false)
  assert(input.isAnyOnStart('U'), false)
  assert(input.isOn('U'), false)
  assert(input.isOnStart('U'), false)
  assert(input.isOff('U'), false)
  assert(input.isOffStart('U'), false)

  assert(input.isComboEndsWith(['U']), false)
  assert(input.isComboEndsWithStart(['U']), false)
  assert(input.isCombo(['U']), false)
  assert(input.isComboStart(['U']), false)

  target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
  input.update(input.minHeldMillis)

  assert(input.on, ['U'])
  assert(input.invalid, true)
  assert(input.gestured, true)
  assert(input.held, true)
  assert(input.started, true)

  assertButton(input, 'U', 'On', 'Start')
  assertCombo(input, [['U']], 'Equal', 'Start')

  input.handled = true

  assert(input.invalid, true)
  assert(input.gestured, true)
  assert(input.held, false)
  assert(input.started, false)

  assert(input.isAnyOn('U'), false)
  assert(input.isAnyOnStart('U'), false)
  assert(input.isOn('U'), false)
  assert(input.isOnStart('U'), false)
  assert(input.isOff('U'), false)
  assert(input.isOffStart('U'), false)

  assert(input.isComboEndsWith(['U']), false)
  assert(input.isComboEndsWithStart(['U']), false)
  assert(input.isCombo(['U']), false)
  assert(input.isComboStart(['U']), false)
})

test('isAnyOn() / isAnyOnStart()', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
  input.update(16 as Millis)

  assert(input.started, true)

  assert(input.isAnyOn('U'), true)
  assert(input.isAnyOnStart('U'), true)

  assert(input.isAnyOn('U', 'D'), true)
  assert(input.isAnyOnStart('U', 'D'), true)

  assert(input.isAnyOn('D'), false)
  assert(input.isAnyOnStart('D'), false)

  assert(input.isAnyOn('D', 'R'), false)
  assert(input.isAnyOnStart('D', 'R'), false)
})

test('started', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  assert(input.started, false)

  target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
  input.update(16 as Millis)

  assert(input.started, true)

  input.update(16 as Millis)
  assert(input.started, false)

  target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
  input.update(16 as Millis)

  assert(input.started, true)
  input.update(16 as Millis)

  assert(input.started, false)
})

test('isOnStart() requires the tested button to change state', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
  input.update(16 as Millis)
  assert(input.isOnStart('U'), true)

  target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowRight'}))
  input.update(16 as Millis)
  assert(input.isOnStart('U'), false)

  target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowRight'}))
  input.update(16 as Millis)
  assert(input.isOnStart('U'), false)

  target.dispatchEvent(KeyTestEvent('keyup', {code: 'ArrowUp'}))
  input.update(16 as Millis)
  assert(input.isOnStart('U'), false)

  target.dispatchEvent(KeyTestEvent('keydown', {code: 'ArrowUp'}))
  input.update(16 as Millis)
  assert(input.isOnStart('U'), true)
})

test('pointer movements update position', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {
        offsetX: 1,
        offsetY: 2
      })
    )
    input.update(16 as Millis)

    assert(input.point?.client, {x: 1, y: 2})
    assert(input.point?.type, 'Mouse')
    assert(input.point?.invalid, true)
  })

  await ctx.test('and position is not lost on update', () => {
    input.update(16 as Millis)

    assert(input.point?.client, {x: 1, y: 2})
    assert(input.point?.type, 'Mouse')
    assert(input.point?.invalid, false)
  })
})

test('pointer clicks are buttons', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(
    PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
  )
  input.update(16 as Millis)

  assertButton(input, 'A', 'On', 'Start')
  assertCombo(input, [['A']], 'Equal', 'Start')
  assert(input.point?.invalid, true)
})

test('pointer secondary clicks are buttons', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(
    PointerTestEvent('pointerdown', {buttons: 2, offsetX: 1, offsetY: 2})
  )
  input.update(16 as Millis)

  assertButton(input, 'B', 'On', 'Start')
  assertCombo(input, [['B']], 'Equal', 'Start')
  assert(input.point?.invalid, true)
})

test('a pointer click can become a drag', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('init', () => {
    assert(input.point?.drag.on, undefined)
    assert(input.point?.drag.start, undefined)
    assert(input.point?.drag.end, undefined)
    assert(input.point?.click, undefined)
    assert(input.point?.invalid, undefined)
  })

  await ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On', 'Start')
    assertCombo(input, [['A']], 'Equal', 'Start')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, true)
    assert(input.point?.drag.start, true)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('pause', () => {
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, true)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.invalid, false)
  })

  await ctx.test('move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 16, offsetY: 12})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, true)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {}))
    input.update(16 as Millis)

    assertButton(input, 'A', 'Off', 'Start')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, true)
    assert.partialDeepStrictEqual(input.point?.click, undefined)
    assert(input.point?.invalid, true)
  })

  await ctx.test('pause again', () => {
    input.update(16 as Millis)

    assertButton(input, 'A', 'Off')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, undefined)
    assert(input.point?.invalid, false)
  })
})

test('a pointer click can become a drag or a pinch', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('init', () => {
    assert(input.point?.drag.on, undefined)
    assert(input.point?.drag.start, undefined)
    assert(input.point?.drag.end, undefined)
    assert.partialDeepStrictEqual(input.point?.click, undefined)
    assert(input.point?.pinch?.xy, undefined)
    assert(input.point?.center, undefined)
    assert(input.point?.invalid, undefined)
  })

  await ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On', 'Start')
    assertCombo(input, [['A']], 'Equal', 'Start')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.pinch?.xy, undefined)
    assert.partialDeepStrictEqual(input.point?.center, {x: 1, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, true)
    assert(input.point?.drag.start, true)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.pinch?.xy, undefined)
    assert.partialDeepStrictEqual(input.point?.center, {x: 6, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('pinch', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 10,
        offsetY: 10,
        pointerId: 2
      })
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, true)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.pinch?.xy, {x: 0, y: 0})
    assert.partialDeepStrictEqual(input.point?.center, {x: 8, y: 6})
    assert(input.point?.invalid, true)
  })

  await ctx.test('expand', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {
        buttons: 1,
        offsetX: 20,
        offsetY: 20,
        pointerId: 2
      })
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.pinch?.xy, {x: 10, y: 10})
    assert.partialDeepStrictEqual(input.point?.center, {x: 13, y: 11})
    assert(input.point?.invalid, true)
  })
})

test('center', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('init', () =>
    assert.partialDeepStrictEqual(input.point?.center, undefined)
  )

  await ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 1, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 10, y: 10})
    assert(input.point?.invalid, true)
  })

  await ctx.test('secondary click', () => {
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
    assert(input.point?.invalid, true)
  })

  await ctx.test('primary unclick', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerup', {offsetX: 30, offsetY: 30})
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 20, y: 20})
    assert(input.point?.invalid, true)
  })
})

test('pinch', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('init', () => {
    assert.partialDeepStrictEqual(input.point?.center, undefined)
    assert(input.point?.pinch, undefined)
    assert(input.point?.invalid, undefined)
  })

  await ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 10, y: 10})
    assert(input.point?.pinch?.xy, undefined)
    assert(input.point?.invalid, true)
  })

  await ctx.test('secondary click', () => {
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
    assert(input.point?.pinch?.xy, {x: 0, y: 0})
    assert(input.point?.invalid, true)
  })

  await ctx.test('expand', () => {
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
    assert(input.point?.pinch?.xy, {x: 10, y: 10})
    assert(input.point?.invalid, true)
  })

  await ctx.test('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {pointerId: 2}))
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 10, y: 10})
    assert(input.point?.pinch?.xy, undefined)
    assert(input.point?.invalid, true)
  })
})

test('wheel', () => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  target.dispatchEvent(WheelTestEvent({deltaX: 1, deltaY: 2, deltaZ: 3}))
  input.update(16 as Millis)

  assert(input.wheel?.delta.client, {x: 1, y: 2, z: 3})
  assert(input.wheel?.delta.xy, {x: 1, y: 2})
})

function assertButton(
  input: Input,
  btn: AnyButton,
  state: 'On' | 'Off',
  edge?: 'Start'
): void {
  assert(input.isAnyOn(btn), state === 'On')
  assert(input.isAnyOnStart(btn), state === 'On' && edge === 'Start')
  assert(input.isOn(btn), state === 'On')
  assert(input.isOnStart(btn), state === 'On' && edge === 'Start')
  assert(input.isOff(btn), state === 'Off')
  assert(input.isOffStart(btn), state === 'Off' && edge === 'Start')
}

function assertCombo(
  input: Input,
  combo: Readonly<Combo>,
  state: 'EndsWith' | 'Equal' | 'Unequal',
  edge?: 'Start'
): void {
  assert(input.isComboEndsWith(...combo), state !== 'Unequal')
  assert(
    input.isComboEndsWithStart(...combo),
    state !== 'Unequal' && edge === 'Start'
  )
  assert(input.isCombo(...combo), state === 'Equal')
  assert(input.isComboStart(...combo), state === 'Equal' && edge === 'Start')
  const abcCombo = combo.map(set => set.sort())
  if (state === 'Equal') assert(input.combo, abcCombo)
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

function DefaultInput(cam: Readonly<Cam>, target: Element): Input {
  const input = new Input(cam, target)
  input.mapDefault()
  return input
}
