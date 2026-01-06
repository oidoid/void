import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {TestEvent} from '../test/test-event.ts'
import {type Context, Renderer} from './renderer.ts'

test('renderer', async ctx => {
  const canvas = new EventTarget() as HTMLCanvasElement
  using renderer = TestRenderer(canvas)

  await ctx.test('no context before loading', () =>
    assert(renderer.hasContext, false)
  )

  await ctx.test('context after loading', () => {
    renderer.load({} as HTMLImageElement)
    assert(renderer.hasContext, true)
  })

  await ctx.test('context lost', () => {
    canvas.dispatchEvent(TestEvent('webglcontextlost'))
    assert(renderer.hasContext, false)
  })

  await ctx.test('context restored', () => {
    canvas.dispatchEvent(TestEvent('webglcontextrestored'))
    assert(renderer.hasContext, true)
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
