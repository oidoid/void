import {afterEach, beforeEach, test} from 'node:test'
import {Looper, type LoopReason} from './looper.ts'
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
  framer.onFrame = (_millis, _reason) => {
    ++frame
  }

  await ctx.test('init', () => assert(frame, 0))

  await ctx.test('register', () => {
    framer.register('add')
    assert(frame, 0)
    assert(framer.age, 0)
  })

  await ctx.test('onFrame()', () => {
    performance.now = () => 8 as Millis
    framer.requestFrame('Render')
    performance.now = () => 24 as Millis // millis = 24 - 8 = 16
    onFrame!()
    assert(frame, 1)
    assert(framer.age, 16 as Millis)
    performance.now = () => 40 as Millis
    framer.requestFrame('Render')
    performance.now = () => 56 as Millis // millis = 56 - 40 = 16
    onFrame!()
    assert(frame, 2)
    assert(framer.age, 32 as Millis)
    performance.now = () => 72 as Millis
    framer.requestFrame('Render')
    performance.now = () => 88 as Millis // millis = 88 - 72 = 16
    onFrame!()
    assert(frame, 3)
    assert(framer.age, 48 as Millis)
  })

  await ctx.test('hidden', () => {
    framer.requestFrame('Render')
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

test('poll reason', async ctx => {
  using framer = new Looper()
  let frame = 0
  let lastReason: LoopReason | undefined
  let skip: 'Skip' | undefined
  framer.onFrame = (_millis, reason) => {
    ++frame
    lastReason = reason
    return skip
  }
  framer.register('add')

  await ctx.test('requestFrame(Render) passes Render reason', () => {
    performance.now = () => 0 as Millis
    framer.requestFrame('Render')
    performance.now = () => 16 as Millis
    onFrame!()
    assert(frame, 1)
    assert(lastReason, 'Render')
  })

  await ctx.test('requestFrame(Poll) passes Poll reason', () => {
    performance.now = () => 16 as Millis
    framer.requestFrame('Poll')
    performance.now = () => 32 as Millis
    onFrame!()
    assert(frame, 2)
    assert(lastReason, 'Poll')
  })

  await ctx.test('upgrade poll to render', () => {
    performance.now = () => 32 as Millis
    framer.requestFrame('Poll')
    // non-poll call upgrades pending poll.
    framer.requestFrame('Render')
    performance.now = () => 48 as Millis
    onFrame!()
    assert(frame, 3)
    assert(lastReason, 'Render')
  })

  await ctx.test('poll does not upgrade to poll', () => {
    performance.now = () => 48 as Millis
    framer.requestFrame('Poll')
    // another poll call doesn't schedule a second rAF.
    framer.requestFrame('Poll')
    performance.now = () => 64 as Millis
    onFrame!()
    assert(frame, 4)
    assert(lastReason, 'Poll')
  })

  await ctx.test('cancel clears reason', () => {
    performance.now = () => 64 as Millis
    framer.requestFrame('Poll')
    framer.register('remove')
    assert(onFrame, undefined)
    // re-register and request normal frame.
    framer.register('add')
    performance.now = () => 80 as Millis
    framer.requestFrame('Render')
    performance.now = () => 96 as Millis
    onFrame!()
    assert(frame, 5)
    assert(lastReason, 'Render')
  })

  await ctx.test('skip does not accumulate age', () => {
    performance.now = () => 96 as Millis
    framer.requestFrame('Poll')
    const ageBefore = framer.age
    skip = 'Skip'
    performance.now = () => 112 as Millis
    onFrame!()
    skip = undefined
    assert(framer.age, ageBefore)
  })
})
