import { BitmapBuffer, Cam, Renderer } from '@/void'

export interface RendererStateMachineProps {
  readonly window: Window
  readonly canvas: HTMLCanvasElement
  newRenderer(): Renderer
  /** Difference in milliseconds. */
  onFrame(delta: number): void
  onPause(): void
}

export class RendererStateMachine {
  #frameID: number | undefined
  #renderer: Renderer
  readonly #canvas: HTMLCanvasElement
  readonly #newRenderer: () => Renderer
  readonly #onFrame: (delta: number) => void
  readonly #onPause: () => void
  readonly #window: Window

  constructor(props: RendererStateMachineProps) {
    this.#canvas = props.canvas
    this.#frameID = undefined
    this.#newRenderer = props.newRenderer
    this.#onFrame = props.onFrame
    this.#onPause = props.onPause
    this.#renderer = props.newRenderer()
    this.#window = props.window
  }

  isContextLost(): boolean {
    return this.#renderer.isContextLost()
  }

  loseContext(): void {
    this.#renderer.loseContext()
  }

  // to-do: this isn't great because we go out for loop callback then back in
  // to render.
  render(time: number, cam: Readonly<Cam>, bitmaps: BitmapBuffer): void {
    this.#renderer.render(time, cam, bitmaps)
  }

  restoreContext(): void {
    this.#renderer.restoreContext()
  }

  start(): void {
    this.#register('add')
    this.#resume()
  }

  stop(): void {
    this.#pause()
    this.#register('remove')
  }

  #isDocumentVisible(): boolean {
    return this.#window.document.visibilityState == 'visible'
  }

  #requestAnimationFrame(then: number | undefined): void {
    this.#frameID = this.#window.requestAnimationFrame((now) =>
      this.#loop(now, then)
    )
  }

  #onEvent = (event: Event): void => {
    event.preventDefault()
    if (event.type == 'webglcontextrestored') {
      this.#renderer = this.#newRenderer()
    }

    if (!this.isContextLost() && this.#isDocumentVisible()) this.#resume()
    else this.#pause()
  }

  #loop(now: number, then: number | undefined) {
    // Duration can be great when a frame is held for debugging. Limit it to
    // one second.
    const delta = Math.min(now - (then ?? now), 1000)
    this.#onFrame(delta)

    // If not paused, request a new frame.
    if (this.#frameID != null) this.#requestAnimationFrame(now)
  }

  #pause(): void {
    if (this.#frameID == null) return
    this.#window.cancelAnimationFrame(this.#frameID)
    this.#frameID = undefined
    if (this.isContextLost()) console.debug('Renderer paused; no GL context.')
    else if (!this.#isDocumentVisible()) {
      console.debug('Renderer paused; document hidden.')
    } else console.debug('Renderer paused.')
    this.#onPause()
  }

  #register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const
    for (const type of ['webglcontextrestored', 'webglcontextlost']) {
      this.#canvas[fn](type, this.#onEvent)
    }
    this.#window[fn]('visibilitychange', this.#onEvent)
  }

  #resume(): void {
    if (this.isContextLost()) {
      console.debug('Renderer cannot resume; no GL context.')
    } else if (!this.#isDocumentVisible()) {
      console.debug('Renderer cannot resume; document hidden.')
    } else if (this.#frameID == null) {
      console.debug('Renderer looping.')
      this.#requestAnimationFrame(undefined)
    }
  }
}
