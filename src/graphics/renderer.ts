import {debug} from '../debug.ts'

export class Renderer {
  #canvas: HTMLCanvasElement
  #clearRGBA: number = 0
  #gl: WebGL2RenderingContext | undefined

  constructor(canvas: HTMLCanvasElement) {
    this.#canvas = canvas
  }

  clear(rgba: number): void {
    if (!this.#ctx) return
    if (this.#clearRGBA !== rgba) {
      this.#clearRGBA = rgba
      this.#ctx.clearColor(
        ((rgba >>> 24) & 0xff) / 0xff,
        ((rgba >>> 16) & 0xff) / 0xff,
        ((rgba >>> 8) & 0xff) / 0xff,
        ((rgba >>> 0) & 0xff) / 0xff
      )
    }
    this.#ctx.clear(this.#ctx.COLOR_BUFFER_BIT | this.#ctx.DEPTH_BUFFER_BIT)
  }

  register(op: 'add' | 'remove'): this {
    this.#canvas[`${op}EventListener`]('webglcontextlost', this.#onContextLoss)
    return this
  }

  render(): void {
    if (!this.#ctx) return
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }

  get #ctx(): WebGL2RenderingContext | undefined {
    return (this.#gl ??= this.#newContext())
  }

  #newContext(): WebGL2RenderingContext | undefined {
    const gl = this.#canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      // avoid flicker caused by clearing the drawing buffer. see
      // https://developer.chrome.com/blog/desynchronized/.
      preserveDrawingBuffer: true,
      ...(!debug?.render && {desynchronized: true})
    })

    // to-do: remove.
    if (gl?.getContextAttributes()?.desynchronized) console.log('low latency')
    else console.log('no low latency')

    return gl ?? undefined
  }

  #onContextLoss = (): void => {
    this.#gl = undefined
  }
}
