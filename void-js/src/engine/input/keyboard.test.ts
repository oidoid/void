import {test} from 'node:test'
import {assert} from '../../test/assert.ts'
import {KeyTestEvent} from '../../test/test-event.ts'
import {Keyboard} from './keyboard.ts'

test('constructor() inits', () => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  assert(kbd.bits, 0)
})

test('bits map to button state: A↓, B↓, A↑', async ctx => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  kbd.bitByCode.KeyA = 1
  kbd.bitByCode.KeyB = 2

  await ctx.test('A↓', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyA'}))
    assert(kbd.bits, 1)
  })

  await ctx.test('B↓', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyB'}))
    assert(kbd.bits, 3)
  })

  await ctx.test('A↑', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'KeyA'}))
    assert(kbd.bits, 2)
  })
})

test('two buttons mapped to the same bit are unioned', async ctx => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  kbd.bitByCode.KeyA = 1
  kbd.bitByCode.KeyB = 1

  await ctx.test('A↓', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyA'}))
    assert(kbd.bits, 1)
  })

  await ctx.test('B↓', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyB'}))
    assert(kbd.bits, 1)
  })

  await ctx.test('A↑', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'KeyA'}))
    assert(kbd.bits, 1)
  })

  await ctx.test('B↑', () => {
    target.dispatchEvent(KeyTestEvent('keyup', {code: 'KeyB'}))
    assert(kbd.bits, 0)
  })
})

test('modifiers and untrusted', async ctx => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  kbd.bitByCode.KeyA = 1

  await ctx.test('modifiers', () => {
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyA', ctrlKey: true}))
    assert(kbd.bits, 0)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyA', altKey: true}))
    assert(kbd.bits, 0)
    target.dispatchEvent(KeyTestEvent('keydown', {code: 'KeyA', metaKey: true}))
    assert(kbd.bits, 0)
  })

  await ctx.test('untrusted', () => {
    target.dispatchEvent(Object.assign(new Event('keydown'), {code: 'KeyA'}))
    assert(kbd.bits, 0)
  })
})

test('preventDefault', async ctx => {
  const target = new EventTarget()
  using kbd = new Keyboard(target).register('add')
  kbd.bitByCode.KeyA = 1
  kbd.bitByCode.Escape = 2

  await ctx.test('mapped code prevents default', () => {
    let prevented = false
    target.dispatchEvent(
      Object.assign(KeyTestEvent('keydown', {code: 'KeyA'}), {
        preventDefault: () => (prevented = true)
      })
    )
    assert(prevented, true)
  })

  await ctx.test('Escape prevents default', () => {
    let prevented = false
    target.dispatchEvent(
      Object.assign(KeyTestEvent('keydown', {code: 'Escape'}), {
        preventDefault: () => (prevented = true)
      })
    )
    assert(prevented, true)
  })

  await ctx.test('shift+Escape does not prevent default', () => {
    let prevented = false
    target.dispatchEvent(
      Object.assign(KeyTestEvent('keydown', {code: 'Escape', shiftKey: true}), {
        preventDefault: () => (prevented = true)
      })
    )
    assert(prevented, false)
  })
})
