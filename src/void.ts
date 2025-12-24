import {Zoo} from './ents/zoo.ts'
import type {Atlas} from './graphics/atlas.ts'
import {parseAtlas} from './graphics/atlas-parser.ts'
import {Cam} from './graphics/cam.ts'
import {PixelRatioObserver} from './graphics/pixel-ratio-observer.ts'
import {Renderer} from './graphics/renderer.ts'
import type {Sprite} from './graphics/sprite.ts'
import {Input} from './input/input.ts'
import {Looper} from './looper.ts'
import type {PoolOpts} from './mem/pool.ts'
import type {PoolMap} from './mem/pool-map.ts'
import {SpritePool} from './mem/sprite-pool.ts'
import type {GameConfig} from './types/game-config.ts'
import type {Millis, Secs} from './types/time.ts'
import {initCanvas} from './utils/canvas-util.ts'
import {parseComputedColor} from './utils/color-util.ts'
import {DelayInterval} from './utils/delay-interval.ts'
import {initBody, initMetaViewport} from './utils/dom-util.ts'
import {loadImage} from './utils/fetch-util.ts'

export type VoidOpts = {
  canvas?: HTMLCanvasElement
  config: GameConfig
  poll?: {delay?: () => Millis; period: Millis}
  preloadAtlas?: HTMLImageElement | null
  sprites?: Partial<Omit<PoolOpts<Sprite>, 'alloc' | 'allocBytes'>>
}

export class Void {
  readonly cam: Cam = new Cam()
  readonly canvas: HTMLCanvasElement
  readonly input: Input
  readonly looper: Looper = new Looper()
  readonly pool: PoolMap
  readonly preload: Atlas
  readonly renderer: Renderer
  /** delta since frame request. */
  readonly tick: {ms: Millis; s: Secs} = {ms: 0, s: 0}
  readonly zoo: Zoo = new Zoo()
  readonly #backgroundRGBA: number
  readonly #pixelRatioObserver: PixelRatioObserver = new PixelRatioObserver()
  readonly #poll: DelayInterval | undefined
  readonly #preloadAtlasImage: HTMLImageElement | undefined
  // may trigger an initial force update.
  readonly #resizeObserver = new ResizeObserver(() => this.onResize())

  constructor(opts: Readonly<VoidOpts>) {
    if (opts.poll != null)
      this.#poll = new DelayInterval(
        opts.poll.delay ?? (() => 0),
        opts.poll.period,
        () => this.onPoll()
      )

    initMetaViewport()
    this.canvas = initCanvas(opts.canvas, opts.config.init.mode)
    if (!this.canvas.parentElement) throw Error('no canvas parent')
    this.#backgroundRGBA =
      opts.config.init.background ??
      parseComputedColor(
        getComputedStyle(this.canvas.parentElement).backgroundColor
      )
    initBody(this.canvas, this.#backgroundRGBA)

    this.cam.minWH = opts.config.init.minWH
    this.cam.mode = opts.config.init.mode
    this.cam.update(this.canvas)

    this.input = new Input(this.cam, this.canvas)
    if (opts.config.init.input !== 'Custom') this.input.mapDefault()
    this.input.onEvent = () => this.onEvent()

    this.#pixelRatioObserver.onChange = () => this.onResize()

    this.#preloadAtlasImage = opts.preloadAtlas ?? undefined

    this.preload = opts.config.atlas
      ? parseAtlas(opts.config.atlas)
      : {anim: {}, celXYWH: [], tags: []}

    this.renderer = new Renderer(this.preload ?? {}, this.canvas, this.looper)

    this.pool = {
      default: SpritePool({
        atlas: this.preload,
        looper: this.looper,
        minPages: opts.sprites?.minPages ?? 3,
        pageBlocks: opts.sprites?.pageBlocks ?? 1000
      })
    }

    this.looper.onFrame = millis => this.onFrame(millis)
  }

  alloc(k: keyof PoolMap = 'default'): Sprite {
    return this.pool[k].alloc()
  }

  get backgroundRGBA(): number {
    return this.#backgroundRGBA
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

    this.zoo.update(this)

    this.cam.postupdate()
  }

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
    this.#pixelRatioObserver.register(op)

    if (op === 'add') this.looper.requestFrame()
    this.#poll?.register(op)

    if (this.#preloadAtlasImage) await loadImage(this.#preloadAtlasImage)
    this.renderer.load(this.#preloadAtlasImage)
  }

  requestFrame(force?: 'Force'): void {
    if (force || this.renderer.always || this.input.anyOn || this.input.gamepad)
      this.looper.requestFrame()
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.register('remove')
  }
}
