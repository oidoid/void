import type {LoaderEnt} from './ents/loader.ts'
import type {Sys} from './ents/sys.ts'
import {Zoo} from './ents/zoo.ts'
import type {Atlas} from './graphics/atlas.ts'
import {parseAtlas} from './graphics/atlas-parser.ts'
import {Cam} from './graphics/cam.ts'
import {PixelRatioObserver} from './graphics/pixel-ratio-observer.ts'
import {Renderer} from './graphics/renderer.ts'
import type {Sprite} from './graphics/sprite.ts'
import {Input} from './input/input.ts'
import type {LevelZoo} from './level/level.ts'
import {type ComponentHook, parseLevel} from './level/level-parser.ts'
import type {LevelSchema} from './level/level-schema.ts'
import {Looper} from './looper.ts'
import type {PoolOpts} from './mem/pool.ts'
import type {PoolMap} from './mem/pool-map.ts'
import {SpritePool} from './mem/sprite-pool.ts'
import {Random} from './random/random.ts'
import type {Millis, Secs} from './types/time.ts'
import type {VoidConfig} from './types/void-config.ts'
import {initCanvas} from './utils/canvas-util.ts'
import {parseComputedColor, rgbaHex} from './utils/color-util.ts'
import {debug} from './utils/debug.ts'
import {DelayInterval} from './utils/delay-interval.ts'
import {initBody, initMetaViewport} from './utils/dom-util.ts'
import {loadImage} from './utils/fetch-util.ts'

export type VoidOpts = {
  canvas?: HTMLCanvasElement | null
  config: VoidConfig
  description?: string
  loader: LoaderEnt
  loaderSys: Sys
  preloadAtlas?: HTMLImageElement | null
  random?: Random
  sprites?: Partial<Omit<PoolOpts<Sprite>, 'alloc' | 'allocBytes'>>
}

export class Void {
  readonly cam: Cam = new Cam()
  readonly canvas: HTMLCanvasElement
  readonly input: Input
  readonly looper: Looper = new Looper()
  readonly pool: PoolMap
  readonly preload: Atlas
  readonly random: Random
  readonly renderer: Renderer
  /** delta since frame request. */
  readonly tick: {ms: Millis; s: Secs} = {ms: 0, s: 0}
  readonly zoo: Zoo = new Zoo()
  #backgroundRGBA: number
  #invalid: boolean = false
  readonly #pixelRatioObserver: PixelRatioObserver = new PixelRatioObserver()
  #poller: DelayInterval | undefined
  readonly #preloadAtlasImage: HTMLImageElement | undefined
  #registered: boolean = false
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

    this.cam.mode = opts.config.mode
    this.cam.update(this.canvas)

    this.random = opts.random ?? new Random(Date.now())

    this.input = new Input(this.cam, this.canvas)
    if (opts.config.input !== 'Custom') this.input.mapDefault()
    this.input.onEvent = () => this.onEvent()

    this.#pixelRatioObserver.onChange = () => this.onResize()

    this.#preloadAtlasImage = opts.preloadAtlas ?? undefined
    if (!!this.#preloadAtlasImage !== !!opts.config.preload)
      throw Error('atlas misconfigured')

    this.preload = opts.config.preload
      ? parseAtlas(opts.config.preload)
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

    this.zoo.addSystem({loader: opts.loaderSys})
    this.zoo.add(opts.loader)

    if (debug) (globalThis as {v?: Void}).v = this
  }

  alloc(k: keyof PoolMap = 'default'): Sprite {
    return this.pool[k].alloc()
  }

  get backgroundRGBA(): number {
    return this.#backgroundRGBA
  }

  set backgroundRGBA(rgba: number) {
    if (!this.canvas.parentElement) throw Error('no canvas parent')
    this.canvas.parentElement.style.backgroundColor = rgbaHex(rgba)
    this.#backgroundRGBA = rgba
  }

  /**
   * invalid state only impacts drawing in the current frame not requesting a
   * new frame.
   */
  get invalid(): boolean {
    return (
      this.zoo.invalid ||
      this.cam.invalid ||
      this.renderer.invalid ||
      this.#invalid
    )
  }

  set invalid(invalid: true) {
    this.#invalid = invalid
  }

  loadLevel(
    json: Readonly<LevelSchema>,
    hook: ComponentHook,
    atlas: Readonly<Atlas>
  ): LevelZoo {
    const lvl = parseLevel(json, this.pool, hook, atlas)
    if (lvl.background != null) this.backgroundRGBA = lvl.background
    if (lvl.minScale != null) this.cam.minScale = lvl.minScale
    if (lvl.minWH != null) this.cam.minWH = lvl.minWH
    if (lvl.zoomOut != null) this.cam.zoomOut = lvl.zoomOut
    return lvl.zoo
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

    this.requestFrame() // request frame before in case update cancels.

    this.#invalid = false
    this.zoo.update(this) // this should be like level.update. otherwise it's alist of zoos

    this.cam.postupdate()
  }

  onPoll(): void {
    this.requestFrame('Force')
  }

  onResize(): void {
    this.requestFrame('Force') // force cam reeval.
  }

  // to-do: clear.
  setPoller(period: Millis, delay?: () => Millis): void {
    if (this.#poller) this.#poller.register('remove')
    this.#poller = new DelayInterval(delay ?? (() => 0), period, () =>
      this.onPoll()
    )
    if (this.#registered) this.#poller.register('add')
  }

  async register(op: 'add' | 'remove'): Promise<void> {
    this.input.register(op)
    this.renderer.register(op)
    this.looper.register(op)
    if (op === 'add') this.#resizeObserver.observe(this.canvas.parentElement!)
    else this.#resizeObserver.unobserve(this.canvas.parentElement!)
    this.#pixelRatioObserver.register(op)

    if (op === 'add') this.looper.requestFrame()
    this.#poller?.register(op)

    if (this.#preloadAtlasImage) await loadImage(this.#preloadAtlasImage)
    this.renderer.load(this.#preloadAtlasImage)
    this.#registered = op === 'add'
  }

  requestFrame(force?: 'Force'): void {
    if (force || this.renderer.always || this.input.anyOn || this.input.gamepad)
      this.looper.requestFrame()
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.register('remove')
  }
}
