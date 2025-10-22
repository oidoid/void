import assert from 'node:assert/strict'
import {afterEach, beforeEach, test} from 'node:test'

import {Looper} from './looper.ts'
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
  delete (globalThis as {[_: string]: unknown}).document
  delete (globalThis as {[_: string]: unknown}).cancelAnimationFrame
  delete (globalThis as {[_: string]: unknown}).requestAnimationFrame
})

test('Looper', ctx => {
  using framer = new Looper()
  let frame = 0
  framer.onFrame = () => ++frame

  ctx.test('init', () => assert.equal(frame, 0))

  ctx.test('register', () => {
    framer.register('add')
    assert.equal(frame, 0)
    assert.equal(framer.age, 0)
  })

  ctx.test('onFrame', () => {
    performance.now = () => 0
    framer.requestFrame()
    performance.now = () => 10 as Millis
    onFrame!()
    assert.equal(frame, 1)
    assert.equal(framer.age, 10)
    framer.requestFrame()
    performance.now = () => 20 as Millis
    onFrame!()
    assert.equal(frame, 2)
    assert.equal(framer.age, 20)
    framer.requestFrame()
    performance.now = () => 30 as Millis
    onFrame!()
    assert.equal(frame, 3)
    assert.equal(framer.age, 30)
  })

  ctx.test('hidden', () => {
    framer.requestFrame()
    doc.hidden = true
    doc.dispatchEvent(TestEvent('visibilitychange'))
    assert.equal(onFrame, undefined)
  })

  ctx.test('shown', () => {
    doc.hidden = false
    doc.dispatchEvent(TestEvent('visibilitychange'))
    performance.now = () => 40 as Millis
    onFrame!()
    assert.equal(frame, 4)
    assert.equal(framer.age, 40)
  })
})
