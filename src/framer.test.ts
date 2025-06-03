import { assertEquals } from '@std/assert'
import { Framer } from './framer.ts'

Deno.test('Framer', async (test) => {
  const doc = Object.assign(new EventTarget(), {hidden: false})
  let onFrame: ((millis: number) => void) | undefined
  using _ = (() => {
    globalThis.document = doc as Document
    globalThis.cancelAnimationFrame = () => onFrame = undefined
    globalThis.requestAnimationFrame = (cb) => {
      onFrame = cb
      return 0
    }
    return {
      [Symbol.dispose]() {
        delete (globalThis as {[_: string]: unknown}).document
        delete (globalThis as {[_: string]: unknown}).cancelAnimationFrame
        delete (globalThis as {[_: string]: unknown}).requestAnimationFrame
      }
    }
  })()
  using framer = new Framer()
  let frame = 0
  framer.onFrame = () => ++frame

  await test.step('init', () => assertEquals(frame, 0))

  await test.step('register', () => {
    framer.register('add')
    assertEquals(frame, 0)
  })

  await test.step('onFrame', () => {
    onFrame?.(0)
    assertEquals(frame, 1)
    onFrame?.(0)
    assertEquals(frame, 2)
    onFrame?.(0)
    assertEquals(frame, 3)
  })

  await test.step('hidden', () => {
    doc.hidden = true
    doc.dispatchEvent(new Event('visibilitychange'))
    assertEquals(onFrame, undefined)
  })

  await test.step('shown', () => {
    doc.hidden = false
    doc.dispatchEvent(new Event('visibilitychange'))
    onFrame?.(0)
    assertEquals(frame, 4)
  })
})
