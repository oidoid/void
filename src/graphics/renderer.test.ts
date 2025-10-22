import assert from 'node:assert/strict'
import {test} from 'node:test'
import {TestEvent} from '../test/test-event.ts'
import {type Context, Renderer} from './renderer.ts'

test('renderer', ctx => {
  const canvas = new EventTarget() as HTMLCanvasElement
  using renderer = TestRenderer(canvas)

  ctx.test('no context before loading', () =>
    assert.equal(renderer.hasContext, false)
  )

  ctx.test('context after loading', () => {
    renderer.load({} as HTMLImageElement)
    assert.equal(renderer.hasContext, true)
  })

  ctx.test('context lost', () => {
    canvas.dispatchEvent(TestEvent('webglcontextlost'))
    assert.equal(renderer.hasContext, false)
  })

  ctx.test('context restored', () => {
    canvas.dispatchEvent(TestEvent('webglcontextrestored'))
    assert.equal(renderer.hasContext, true)
  })
})

function TestRenderer(canvas: HTMLCanvasElement): Renderer {
  const renderer = new Renderer({anim: {}, celXYWH: [], tags: []}, canvas, {
    age: 0
  })
  renderer._Context = () => ({}) as Context
  renderer.register('add')
  return renderer
}
