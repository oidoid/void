import assert from 'node:assert/strict'
import {test} from 'node:test'
import {KeyTestEvent} from '../test/test-event.ts'
import {Keyboard} from './keyboard.ts'

test('Keyboard', async ctx => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  kbd.bitByKey.a = 1
  kbd.bitByKey.b = 2

  ctx.test('init', () => assert.equal(kbd.bits, 0))

  ctx.test('a down', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'a'}))
    assert.equal(kbd.bits, 1)
  })

  ctx.test('b down', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {key: 'b'}))
    assert.equal(kbd.bits, 3)
  })

  ctx.test('a up', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {key: 'a'}))
    assert.equal(kbd.bits, 2)
  })
})
