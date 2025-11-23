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
  globalThis.requestAnimationFrame = cb => {
    onFrame = cb as () => void
    return 1
  }
})
afterEach(() => {
  performance.now = oldNow
  delete (globalThis as Partial<typeof globalThis>).document
  delete (globalThis as Partial<typeof globalThis>).cancelAnimationFrame
  delete (globalThis as Partial<typeof globalThis>).requestAnimationFrame
})

test('Looper', ctx => {
  using framer = new Looper()
  let frame = 0
  framer.onFrame = () => ++frame

  ctx.test('init', () => assert(frame, 0))

  ctx.test('register', () => {
    framer.register('add')
    assert(frame, 0)
    assert(framer.age, 0)
  })

  ctx.test('onFrame', () => {
    performance.now = () => 0
    framer.requestFrame()
    performance.now = () => 10 as Millis
    onFrame!()
    assert(frame, 1)
    assert(framer.age, 10 as Millis)
    framer.requestFrame()
    performance.now = () => 20 as Millis
    onFrame!()
    assert(frame, 2)
    assert(framer.age, 20 as Millis)
    framer.requestFrame()
    performance.now = () => 30 as Millis
    onFrame!()
    assert(frame, 3)
    assert(framer.age, 30 as Millis)
  })

  ctx.test('hidden', () => {
    framer.requestFrame()
    doc.hidden = true
    doc.dispatchEvent(TestEvent('visibilitychange'))
    assert(onFrame, undefined)
  })

  ctx.test('shown', () => {
    doc.hidden = false
    doc.dispatchEvent(TestEvent('visibilitychange'))
    performance.now = () => 40 as Millis
    onFrame!()
    assert(frame, 4)
    assert(framer.age, 40 as Millis)
  })
})
