import {test} from 'node:test'
import * as bridge from '../eng/bridge.ts'
import {assert} from '../test/assert.ts'
import {KeyTestEvent} from '../test/test-event.ts'
import {Keyboard, keyByCode} from './keyboard.ts'

test('constructor() inits', () => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')
  assert(kbd.keys, 0)
  assert(kbd.text, '')
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

test('F9 maps to screenshot until released', () => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')

  canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'F9'}))
  assert(kbd.keys, bridge.keyScreenshot)
  canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'F9', repeat: true}))
  assert(kbd.keys, bridge.keyScreenshot)
  canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'Space'}))
  assert(kbd.keys, bridge.keyScreenshot | bridge.keyA)
  canvas.dispatchEvent(KeyTestEvent('keyup', {code: 'F9'}))
  assert(kbd.keys, bridge.keyA)
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

test('text from drop', () => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')
  assert(kbd.text, '')
  canvas.dispatchEvent(
    Object.assign(new Event('drop'), {
      dataTransfer: {
        getData: (type: string) => (type === 'text/plain' ? 'hello' : '')
      }
    })
  )
  assert(kbd.text, 'hello')
})

function TestElement(): Element {
  const target = new EventTarget()
  return Object.assign(target, {
    style: {},
    focus() {},
    ownerDocument: {createElement: () => target}, // return self.
    parentNode: {appendChild() {}},
    value: ''
  }) as unknown as Element
}
