import {afterAll, describe, expect, test} from 'bun:test'
import * as bridge from '../eng/bridge.ts'
import {TestEventTarget} from '../test/test-event-target.ts'
import {KeyTestEvent} from '../test/test-event.ts'
import {Keyboard, keyByCode} from './keyboard.ts'

test('constructor() inits', () => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')
  expect(kbd.keys).toBe(0)
  expect(kbd.text).toBe('')
})

describe('bits map to button state: A↓, B↓, A↑', () => {
  const canvas = TestElement()
  const kbd = new Keyboard(canvas).register('add')
  afterAll(() => kbd[Symbol.dispose]())

  test('A↓', () => {
    canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'ShiftLeft'}))
    expect(kbd.keys).toBe(keyByCode['ShiftLeft']!)
  })

  test('B↓', () => {
    canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyX'}))
    expect(kbd.keys).toBe(keyByCode['ShiftLeft']! | keyByCode['KeyX']!)
  })

  test('A↑', () => {
    canvas.dispatchEvent(KeyTestEvent('keyup', {code: 'ShiftLeft'}))
    expect(kbd.keys).toBe(keyByCode['KeyX']!)
  })
})

describe('two buttons mapped to the same bit are unioned', () => {
  const canvas = TestElement()
  const kbd = new Keyboard(canvas).register('add')
  afterAll(() => kbd[Symbol.dispose]())

  test('A↓', () => {
    canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'ShiftLeft'}))
    expect(kbd.keys).toBe(keyByCode['ShiftLeft']!)
  })

  test('B↓', () => {
    canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'Space'}))
    expect(kbd.keys).toBe(keyByCode['ShiftLeft']!)
  })

  test('A↑', () => {
    canvas.dispatchEvent(KeyTestEvent('keyup', {code: 'ShiftLeft'}))
    expect(kbd.keys).toBe(keyByCode['Space']!)
  })

  test('B↑', () => {
    canvas.dispatchEvent(KeyTestEvent('keyup', {code: 'Space'}))
    expect(kbd.keys).toBe(0)
  })
})

test('F9 maps to screenshot until released', () => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')

  canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'F9'}))
  expect(kbd.keys).toBe(bridge.keyScreenshot)
  canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'F9', repeat: true}))
  expect(kbd.keys).toBe(bridge.keyScreenshot)
  canvas.dispatchEvent(KeyTestEvent('keydown', {code: 'Space'}))
  expect(kbd.keys).toBe(bridge.keyScreenshot | bridge.keyA)
  canvas.dispatchEvent(KeyTestEvent('keyup', {code: 'F9'}))
  expect(kbd.keys).toBe(bridge.keyA)
})

test('untrusted', () => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')
  canvas.dispatchEvent(Object.assign(new Event('keydown'), {code: 'KeyA'}))
  expect(kbd.keys).toBe(0)
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
  expect(stopped).toBe(true)
})

test('text from drop', () => {
  const canvas = TestElement()
  using kbd = new Keyboard(canvas).register('add')
  expect(kbd.text).toBe('')
  canvas.dispatchEvent(
    Object.assign(new Event('drop'), {
      dataTransfer: {
        getData: (type: string) => (type === 'text/plain' ? 'hello' : '')
      }
    })
  )
  expect(kbd.text).toBe('hello')
})

function TestElement(): Element {
  const target = new TestEventTarget()
  return Object.assign(target, {
    style: {},
    focus() {},
    ownerDocument: {createElement: () => target}, // return self.
    parentNode: {appendChild() {}},
    value: ''
  }) as unknown as Element
}
