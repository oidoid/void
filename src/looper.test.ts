import {afterEach, beforeEach, test} from 'node:test'
import {Looper} from './looper.ts'
import {assert} from './test/assert.ts'
import {TestEvent} from './test/test-event.ts'
import type {Millis} from './types/time.ts'

const doc = Object.assign(new EventTarget(), {hidden: false})
let oldNow: () => Millis
let onFrame: (() => void) | undefined

beforeEach(() => {
  oldNow = performance.now
  globalThis.document = doc as Document
  globalThis.cancelAnimationFrame = () => (onFrame = undefined)
  globalThis.requestAnimationFrame = hook => {
    onFrame = hook as () => void
    return 1
  }
})
afterEach(() => {
  performance.now = oldNow
  delete (globalThis as Partial<typeof globalThis>).document
  delete (globalThis as Partial<typeof globalThis>).cancelAnimationFrame
  delete (globalThis as Partial<typeof globalThis>).requestAnimationFrame
})

test('Looper', async ctx => {
  using framer = new Looper()
  let frame = 0
  framer.onFrame = () => ++frame

  await ctx.test('init', () => assert(frame, 0))

  await ctx.test('register', () => {
    framer.register('add')
    assert(frame, 0)
    assert(framer.age, 0)
  })

  await ctx.test('onFrame()', () => {
    performance.now = () => 8 as Millis
    framer.requestFrame()
    performance.now = () => 24 as Millis // millis = 24 - 8 = 16
    onFrame!()
    assert(frame, 1)
    assert(framer.age, 16 as Millis)
    performance.now = () => 40 as Millis
    framer.requestFrame()
    performance.now = () => 56 as Millis // millis = 56 - 40 = 16
    onFrame!()
    assert(frame, 2)
    assert(framer.age, 32 as Millis)
    performance.now = () => 72 as Millis
    framer.requestFrame()
    performance.now = () => 88 as Millis // millis = 88 - 72 = 16
    onFrame!()
    assert(frame, 3)
    assert(framer.age, 48 as Millis)
  })

  await ctx.test('hidden', () => {
    framer.requestFrame()
    doc.hidden = true
    doc.dispatchEvent(TestEvent('visibilitychange'))
    assert(onFrame, undefined)
  })

  await ctx.test('shown', () => {
    doc.hidden = false
    performance.now = () => 100 as Millis
    doc.dispatchEvent(TestEvent('visibilitychange'))
    performance.now = () => 116 as Millis // millis = 116 - 100 = 16
    onFrame!()
    assert(frame, 4)
    assert(framer.age, 64 as Millis) // 48 + 16
  })
})
