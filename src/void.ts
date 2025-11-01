import {Zoo} from './ents/zoo.ts'
import type {Anim, Atlas, AtlasJSON, TagFormat} from './graphics/atlas.ts'
import {parseAtlas} from './graphics/atlas-parser.ts'
import {Cam} from './graphics/cam.ts'
import {Renderer} from './graphics/renderer.ts'
import {drawableBytes, Sprite} from './graphics/sprite.ts'
import {type DefaultButton, Input} from './input/input.ts'
import {Looper} from './looper.ts'
import {Pool, type PoolOpts} from './mem/pool.ts'
import type {WH} from './types/geo.ts'
import type {Millis, Secs} from './types/time.ts'
import {initCanvas} from './utils/canvas-util.ts'
import {parseComputedColor} from './utils/color-util.ts'
import {DelayInterval} from './utils/delay-interval.ts'
import {initBody, initMetaViewport} from './utils/dom-util.ts'
import {loadImage} from './utils/fetch-util.ts'

export type VoidOpts<Tag extends TagFormat> = {
  backgroundRGBA?: number
  canvas?: HTMLCanvasElement | undefined
  input?: 'Custom' | 'Default' | undefined
  minWH?: WH | undefined
  mode?: 'Float' | 'Int' | undefined
  poll?: {delay?: (() => Millis) | undefined; period: Millis} | undefined
  preloadAtlas?: {image: HTMLImageElement; json: AtlasJSON} | undefined
  sprites?:
    | Partial<Omit<PoolOpts<Sprite<Tag>>, 'alloc' | 'allocBytes'>>
    | undefined
}

export class Void<
  Tag extends TagFormat,
  Button extends string = DefaultButton
> {
  readonly cam: Cam = new Cam()
  readonly canvas: HTMLCanvasElement
  readonly input: Input<Button>
  readonly preload: Atlas<Tag>
  readonly renderer: Renderer
  readonly sprites: Pool<Sprite<Tag>>
  readonly zoo: Zoo<Tag> = new Zoo()
  readonly looper: Looper = new Looper()
  /** delta since frame request. */
  readonly tick: {ms: Millis; s: Secs} = {ms: 0, s: 0}
  readonly #backgroundRGBA: number
  readonly #poll: DelayInterval | undefined
  readonly #preloadAtlasImage: HTMLImageElement | undefined
  // may trigger an initial force update.
  readonly #resizeObserver = new ResizeObserver(() => this.onResize())

  constructor(opts: Readonly<VoidOpts<Tag>>) {
    if (opts.poll != null)
      this.#poll = new DelayInterval(
        opts.poll.delay ?? (() => 0),
        opts.poll.period,
        () => this.onPoll()
      )

    const mode = opts.mode ?? 'Int'
    initMetaViewport()
    this.canvas = initCanvas(opts.canvas, mode)
    if (!this.canvas.parentElement) throw Error('no canvas parent')
    this.#backgroundRGBA =
      opts.backgroundRGBA ??
      parseComputedColor(
        getComputedStyle(this.canvas.parentElement).backgroundColor
      )
    initBody(this.canvas, this.#backgroundRGBA)

    if (opts.minWH) this.cam.minWH = opts.minWH
    this.cam.mode = mode
    this.cam.update(this.canvas)

    this.input = new Input(this.cam, this.canvas)
    if (opts.input !== 'Custom') this.input.mapDefault()
    this.input.onEvent = () => this.onEvent()

    if (opts.preloadAtlas) this.#preloadAtlasImage = opts.preloadAtlas.image

    this.preload = opts.preloadAtlas
      ? parseAtlas(opts.preloadAtlas.json)
      : {anim: {} as {[tag in Tag]: Anim}, celXYWH: [], tags: []}

    this.renderer = new Renderer(this.preload ?? {}, this.canvas, this.looper)

    this.sprites = new Pool({
      alloc: pool => this.onAllocSprite(pool),
      allocBytes: drawableBytes,
      init: sprite => sprite.init(),
      minPages: opts.sprites?.minPages ?? 3,
      pageBlocks: opts.sprites?.pageBlocks ?? 1000
    })

    this.looper.onFrame = millis => this.onFrame(millis)
  }

  get backgroundRGBA(): number {
    return this.#backgroundRGBA
  }

  onAllocSprite(pool: Pool<Sprite<Tag>>): Sprite<Tag> {
    return new Sprite(pool, 0, this.preload, this.looper)
  }

  onEvent(): void {
    this.requestFrame('Force')
  }

  /** update input, update canvas, update cam, update world, then render. */
  onFrame(millis: Millis): void {
    this.tick.ms = millis
    this.tick.s = (millis / 1000) as Secs
    if (document.hidden) return
    this.input.update(millis)

    this.requestFrame() // request frame before in case loop cancels.

    this.onLoop()

    this.cam.postupdate()
  }

  onLoop(): void {}

  onPoll(): void {
    this.requestFrame('Force')
  }

  onResize(): void {
    this.requestFrame('Force') // force cam reeval.
  }

  async register(op: 'add' | 'remove'): Promise<void> {
    this.input.register(op)
    this.renderer.register(op)
    this.looper.register(op)
    if (op === 'add') this.#resizeObserver.observe(this.canvas.parentElement!)
    else this.#resizeObserver.unobserve(this.canvas.parentElement!)

    if (op === 'add') this.looper.requestFrame()
    this.#poll?.register(op)

    if (this.#preloadAtlasImage) await loadImage(this.#preloadAtlasImage)
    this.renderer.load(this.#preloadAtlasImage)
  }

  requestFrame(force?: 'Force' | undefined): void {
    if (force || this.renderer.always || this.input.anyOn || this.input.gamepad)
      this.looper.requestFrame()
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.register('remove')
  }
}
