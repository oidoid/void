
export class Void {
  readonly metrics: Metrics = {
    cur: {collide: 0, update: 0},
    prev: {collide: 0, frame: 0, update: 0}
  }
  /** delta since frame request. */
  readonly tick: Tick = {ms: 0, s: 0, start: 0}
  #invalid: boolean = false
  /** may trigger an initial force update. */
  readonly #resizeObserver = new ResizeObserver(() => this.onResize())

  constructor(opts: Readonly<VoidOpts>) {
    initMetaViewport(opts.description)
    this.canvas = initCanvas(opts.canvas, opts.config.mode)
    if (!this.canvas.parentElement) throw Error('no canvas parent')
    this.#backgroundRGBA = parseComputedColor(
      getComputedStyle(this.canvas.parentElement).backgroundColor
    )
    if (!opts.canvas) initBody()

    this.input.onEvent = () => this.onEvent()


    // this doesn't really work. we only get `onContextRestored()` when pending
    // RAF.
    this.renderer.onContextRestored = () => this.onEvent()


    this.looper.onHidden = () => this.onHidden()

  }


  /**
   * invalid state only impacts drawing in the current frame not requesting a
   * new frame.
   */
  get invalid(): boolean {
    return this.cam.invalid || this.renderer.invalid || this.#invalid
  }

  /** does not impact cam or renderer invalid state. */
  set invalid(invalid: boolean) {
    this.#invalid = invalid
  }

  onEvent(): void {
    this.requestFrame('Force')
  }

  /** update input, update canvas, update cam, update world, then render. */
  onFrame(millis: Millis, reason: LoopReason): 'Skip' | undefined {
    this.tick.ms = millis
    this.tick.s = (millis / 1000) as Secs
    this.tick.start = this.looper.start
    if (document.hidden) return
    this.input.update(millis)
    if (
      this.input.gestured &&
      !document.hidden &&
      this.audio.context.state === 'suspended'
    )
      void this.audio.context.resume()

    // request frame before in case update cancels. next reason is 'Render' when
    // input.
    const nextReason = this.requestFrame()
    if (reason === 'Poll' && nextReason !== 'Render') return 'Skip'

    this.#invalid = false
    this.metrics.cur.collide = 0
    this.metrics.cur.update = 0
    this.loader.update(this)
    this.metrics.prev.collide = this.metrics.cur.collide
    this.metrics.prev.update = this.metrics.cur.update

    this.cam.postupdate()
    this.metrics.prev.frame = (performance.now() - this.looper.start) as Millis
  }

  onHidden(): void {
    void this.audio.context.suspend()
  }

  onInterval(): void {
    this.requestFrame('Force')
  }

  onResize(): void {
    this.requestFrame('Force') // force cam reeval.
  }

  requestFrame(force?: 'Force'): LoopReason | undefined {
    let reason: LoopReason | undefined
    if (force || this.input.invalid || this.input.anyOn || this.renderer.always)
      reason = 'Render'
    else if (this.input.gamepad) reason = 'Poll'

    if (reason) this.looper.requestFrame(reason)
    return reason
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.register('remove')
  }
}
