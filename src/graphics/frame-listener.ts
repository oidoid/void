import {Input} from '../input/input.js'
import {BitmapBuffer} from './bitmap.js'
import {Cam} from './cam.js'
import {Renderer} from './renderer.js'

export class FrameListener {
  /** The running lifetime in milliseconds. */
  age = 0
  /** The exact duration in milliseconds to apply on a given update step. */
  tick = 0

  readonly #canvas: HTMLCanvasElement
  #frame?: number | undefined
  #loop?: (() => void) | undefined
  #time?: number | undefined
  readonly #input: Input
  readonly #renderer: Renderer

  constructor(
    canvas: HTMLCanvasElement,
    input: Input<string>,
    renderer: Renderer
  ) {
    this.#canvas = canvas
    this.#input = input
    this.#renderer = renderer
  }

  cancel(): void {
    if (this.#frame != null) cancelAnimationFrame(this.#frame)
    this.#frame = undefined
    this.tick = 0
    this.#time = undefined
    this.#input.reset()
    this.#loop = undefined
  }

  get frame(): number {
    // Assume 60 FPS so games can scale to this number regardless of actual.
    return Math.trunc(this.age / 16.666666666666668)
  }

  register(op: 'add' | 'remove'): void {
    const fn = <const>`${op}EventListener`
    for (const type of ['webglcontextrestored', 'webglcontextlost']) {
      this.#canvas[fn](type, this.#onEvent, true)
    }
    globalThis[fn]('visibilitychange', this.#onEvent, true)
    if (op === 'add') this.#renderer.initGL()
    this.#input.register(op)
  }

  render(cam: Readonly<Cam>, buffer: BitmapBuffer, loop?: () => void): void {
    this.#loop = loop
    if (!this.#isVisible() || !this.#renderer.hasContext()) return
    if (this.#loop) this.#frame ??= requestAnimationFrame(this.#onFrame)
    this.#renderer.render(cam, this.frame, buffer)
  }

  #isVisible(): boolean {
    return document.visibilityState === 'visible'
  }

  #onEvent = (event: Event): void => {
    event.preventDefault()
    if (event.type === 'webglcontextrestored') this.#renderer.initGL()

    if (this.#renderer.hasContext() && this.#isVisible()) {
      if (this.#loop) this.#frame ??= requestAnimationFrame(this.#onFrame)
    } else {
      if (this.#frame != null) cancelAnimationFrame(this.#frame)
      this.#frame = undefined
      this.tick = 0
      this.#time = undefined
      this.#input.reset()
    }
  }

  #onFrame = (time: number): void => {
    this.#frame = undefined
    this.tick = time - (this.#time ?? time)
    this.#time = time
    this.age += this.tick
    const loop = this.#loop
    this.#loop = undefined
    this.#input.poll(this.tick)
    loop?.()
  }
}
