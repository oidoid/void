import assert from 'node:assert/strict'
import {afterEach, beforeEach, describe, test} from 'node:test'

import {Framer} from './framer.ts'
import {TestEvent} from './test/test-event.ts'
import type {Millis} from './types/time.ts'

describe('Framer', () => {
  const doc = Object.assign(new EventTarget(), {hidden: false})
  let onFrame: ((millis: Millis) => void) | undefined
  beforeEach(() => {
    globalThis.document = doc as Document
    globalThis.cancelAnimationFrame = () => (onFrame = undefined)
    globalThis.requestAnimationFrame = cb => {
      onFrame = cb
      return 1
    }
  })
  afterEach(() => {
    delete (globalThis as {[_: string]: unknown}).document
    delete (globalThis as {[_: string]: unknown}).cancelAnimationFrame
    delete (globalThis as {[_: string]: unknown}).requestAnimationFrame
  })
  using framer = new Framer()
  let frame = 0
  framer.onFrame = () => ++frame

  test('init', () => assert.equal(frame, 0))

  test('register', () => {
    framer.register('add')
    assert.equal(frame, 0)
    assert.equal(framer.age, 0)
  })

  test('onFrame', () => {
    framer.requestFrame()
    onFrame!(10 as Millis)
    assert.equal(frame, 1)
    assert.equal(framer.age, 10)
    framer.requestFrame()
    onFrame!(20 as Millis)
    assert.equal(frame, 2)
    assert.equal(framer.age, 20)
    framer.requestFrame()
    onFrame!(30 as Millis)
    assert.equal(frame, 3)
    assert.equal(framer.age, 30)
  })

  test('hidden', () => {
    framer.requestFrame()
    doc.hidden = true
    doc.dispatchEvent(TestEvent('visibilitychange'))
    assert.equal(onFrame, undefined)
  })

  test('shown', () => {
    doc.hidden = false
    doc.dispatchEvent(TestEvent('visibilitychange'))
    onFrame!(40 as Millis)
    assert.equal(frame, 4)
    assert.equal(framer.age, 40)
  })
})
