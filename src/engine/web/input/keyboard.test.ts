import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {KeyTestEvent} from '../test/test-event.ts'
import {Keyboard, keyByCode} from './keyboard.ts'

test('constructor() inits', () => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')
  assert(kbd.keys, 0)
})

test('bits map to button state: A↓, B↓, A↑', async ctx => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')

  await ctx.test('A↓', () => {
    canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'ShiftLeft'}))
    assert(kbd.keys, keyByCode.ShiftLeft)
  })

  await ctx.test('B↓', () => {
    canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyX'}))
    assert(kbd.keys, keyByCode.ShiftLeft! | keyByCode.KeyX!)
  })

  await ctx.test('A↑', () => {
    canvas.dispatchEvent(KeyTestEvent('keyup', {code: 'ShiftLeft'}))
    assert(kbd.keys, keyByCode.KeyX)
  })
})

test('two buttons mapped to the same bit are unioned', async ctx => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')

  await ctx.test('A↓', () => {
    canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'ShiftLeft'}))
    assert(kbd.keys, keyByCode.ShiftLeft)
  })

  await ctx.test('B↓', () => {
    canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'Space'}))
    assert(kbd.keys, keyByCode.ShiftLeft)
  })

  await ctx.test('A↑', () => {
    canvas.dispatchEvent(KeyTestEvent('keyup', {code: 'ShiftLeft'}))
    assert(kbd.keys, keyByCode.Space)
  })

  await ctx.test('B↑', () => {
    canvas.dispatchEvent(KeyTestEvent('keyup', {code: 'Space'}))
    assert(kbd.keys, 0)
  })
})

test('untrusted', () => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')
  canvas.dispatchEvent(Object.assign(new Event('keydown'), {code: 'KeyA'}))
  assert(kbd.keys, 0)
})

test('stopPropagation()', () => {
  const canvas = TestElement()
  using _kbd = new Keyboard(canvas).register('add')

  let stopped = false
  canvas.dispatchEvent(
    KeyTestEvent('keydown', {
      code: 'KeyA',
      stopPropagation: () => (stopped = true)
    })
  )
  assert(stopped, true)
})

function TestElement(): Element {
  const target = new EventTarget()
  return Object.assign(target, {
    style: {},
    focus() {},
    ownerDocument: {createElement: () => target},
    parentNode: {appendChild() {}}
  }) as unknown as Element
}
