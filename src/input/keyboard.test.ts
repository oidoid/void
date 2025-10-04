import assert from 'node:assert/strict'
import {test} from 'node:test'
import {KeyTestEvent} from '../test/test-event.ts'
import {Keyboard} from './keyboard.ts'

test('constructor() inits', () => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  assert.equal(kbd.bits, 0)
})

test('bits map to button state: A↓, B↓, A↑', ctx => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  kbd.bitByCode.KeyA = 1
  kbd.bitByCode.KeyB = 2

  ctx.test('A↓', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyA'}))
    assert.equal(kbd.bits, 1)
  })

  ctx.test('B↓', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyB'}))
    assert.equal(kbd.bits, 3)
  })

  ctx.test('A↑', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'KeyA'}))
    assert.equal(kbd.bits, 2)
  })
})

test('two buttons mapped to the same bit are unioned', ctx => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  kbd.bitByCode.KeyA = 1
  kbd.bitByCode.KeyB = 1

  ctx.test('A↓', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyA'}))
    assert.equal(kbd.bits, 1)
  })

  ctx.test('B↓', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyB'}))
    assert.equal(kbd.bits, 1)
  })

  ctx.test('A↑', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'KeyA'}))
    assert.equal(kbd.bits, 1)
  })

  ctx.test('B↑', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'KeyB'}))
    assert.equal(kbd.bits, 0)
  })
})
