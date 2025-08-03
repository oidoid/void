import assert from 'node:assert/strict'
import {afterEach, beforeEach, describe, test} from 'node:test'

import {Framer} from './framer.ts'
import {TestEvent} from './test/test-event.ts'

describe('Framer', () => {
  const doc = Object.assign(new EventTarget(), {hidden: false})
  let onFrame: ((millis: number) => void) | undefined
  const now = performance.now
  beforeEach(() => {
    globalThis.document = doc as Document
    globalThis.cancelAnimationFrame = () => (onFrame = undefined)
    globalThis.requestAnimationFrame = cb => {
      onFrame = cb
      return 0
    }
    performance.now = () => 0
  })
  afterEach(() => {
    delete (globalThis as {[_: string]: unknown}).document
    delete (globalThis as {[_: string]: unknown}).cancelAnimationFrame
    delete (globalThis as {[_: string]: unknown}).requestAnimationFrame
    performance.now = now
  })
  using framer = new Framer()
  let frame = 0
  framer.onFrame = () => ++frame

  test('init', () => assert.equal(frame, 0))

  test('register', () => {
    framer.register('add')
    assert.equal(frame, 0)
    assert.equal(framer.frame, 0)
    assert.equal(framer.age, 0)
  })

  test('onFrame', () => {
    onFrame!(10)
    assert.equal(frame, 1)
    assert.equal(framer.frame, 1)
    assert.equal(framer.age, 10)
    onFrame!(10)
    assert.equal(frame, 2)
    assert.equal(framer.frame, 2)
    assert.equal(framer.age, 20)
    onFrame!(10)
    assert.equal(frame, 3)
    assert.equal(framer.frame, 3)
    assert.equal(framer.age, 30)
  })

  test('hidden', () => {
    doc.hidden = true
    doc.dispatchEvent(TestEvent('visibilitychange'))
    assert.equal(onFrame, undefined)
  })

  test('shown', () => {
    doc.hidden = false
    doc.dispatchEvent(TestEvent('visibilitychange'))
    onFrame!(10)
    assert.equal(frame, 4)
    assert.equal(framer.frame, 4)
    assert.equal(framer.age, 40)
  })
})
