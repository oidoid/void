import type {Zoo} from './ents/zoo.ts'
import type {AtlasMap} from './graphics/atlas.ts'
import {parseAtlas} from './graphics/atlas-parser.ts'
import {Cam} from './graphics/cam.ts'
import {PixelRatioObserver} from './graphics/pixel-ratio-observer.ts'
import {Renderer} from './graphics/renderer.ts'
import type {Sprite} from './graphics/sprite.ts'
import type {LevelTiles, Tileset} from './graphics/tileset.ts'
import {Input} from './input/input.ts'
import type {CamConfig} from './level/level.ts'
import {type EntPropParser, parseLevel} from './level/level-parser.ts'
import type {LevelSchema} from './level/level-schema.ts'
import type {Loader} from './level/loader.ts'
import {Looper, type LoopReason} from './looper.ts'
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
  /** the default atlas. */
  atlas: HTMLImageElement | null
  canvas?: HTMLCanvasElement | null
  config: VoidConfig
  description?: string
  loader: Loader
  random?: Random
  sprites?: Partial<Omit<PoolOpts<Sprite>, 'alloc' | 'allocBytes'>>
  tileset?: HTMLImageElement | null
}

export type Metrics = {
  update: Millis
  prev: {
    draw: Millis
    /** duration from frame delivery to yield. */
    frame: Millis
    update: Millis
  }
}

export class Void {
  readonly atlas: AtlasMap
  readonly cam: Cam = new Cam()
  readonly canvas: HTMLCanvasElement
  readonly input: Input
  level: LevelTiles | undefined
  readonly loader: Loader
  readonly looper: Looper = new Looper()
  readonly pool: PoolMap
  readonly random: Random
  readonly renderer: Renderer
  readonly tileset: Tileset | undefined
  /** delta since frame request. */
  readonly tick: {ms: Millis; s: Secs} = {ms: 0, s: 0}
  /** accumulated durations of ent update and draw passes. current frame is being built; prev is the last completed frame. */
  readonly metrics: Metrics = {
    update: 0,
    prev: {draw: 0, frame: 0, update: 0}
  }
  readonly #atlasImage: HTMLImageElement
  readonly #tilesetImage: HTMLImageElement | undefined
  #backgroundRGBA: number
  #invalid: boolean = false
  readonly #pixelRatioObserver: PixelRatioObserver = new PixelRatioObserver()
  #interval: DelayInterval | undefined
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

    if (!opts.atlas) throw Error('no atlas image')
    this.#atlasImage = opts.atlas
    this.#tilesetImage = opts.tileset ?? undefined

    this.atlas = {
      default: opts.config.atlas
        ? parseAtlas(opts.config.atlas)
        : {anim: {}, celXYWH: [], tags: []}
    }

    this.renderer = new Renderer(this.atlas.default, this.canvas, this.looper)
    // this doesn't really work. we only get `onContextRestored()` when pending
    // RAF.
    this.renderer.onContextRestored = () => this.onEvent()

    this.tileset = opts.config.tileset

    this.pool = {
      default: SpritePool({
        atlas: this.atlas.default,
        looper: this.looper,
        minPages: opts.sprites?.minPages ?? 3,
        pageBlocks: opts.sprites?.pageBlocks ?? 1000
      })
    }

    this.looper.onFrame = (millis, reason) => this.onFrame(millis, reason)

    this.loader = opts.loader

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

  clearInterval(): void {
    this.#interval?.register('remove')
    this.#interval = undefined
  }

  configCam(config: Readonly<CamConfig>): void {
    if (config.minScale != null) this.cam.minScale = config.minScale
    if (config.minWH) this.cam.minWH = config.minWH
    if (config.x != null) this.cam.x = config.x
    if (config.y != null) this.cam.y = config.y
    if (config.zoomOut != null) this.cam.zoomOut = config.zoomOut
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

  loadLevel(
    json: Readonly<LevelSchema>,
    atlas: keyof AtlasMap,
    parseProp: EntPropParser
  ): Zoo {
    const lvl = parseLevel(json, this.pool, parseProp, this.atlas[atlas])
    if (lvl.background != null) this.backgroundRGBA = lvl.background
    if (lvl.cam) this.configCam(lvl.cam)
    this.level = lvl.tiles
    this.cam.bounds = lvl.tiles
    if (lvl.tiles != null && this.tileset) {
      const w = Math.ceil(lvl.tiles.w / this.tileset.tileWH.w)
      const h = Math.ceil(lvl.tiles.h / this.tileset.tileWH.h)
      if (lvl.tiles.tiles.length !== w * h) throw Error(`tiles not ${w}×${h}`)
      this.renderer.setTiles(this.tileset, lvl.tiles)
    }
    return lvl.zoo
  }

  onEvent(): void {
    this.requestFrame('Force')
  }

  /** update input, update canvas, update cam, update world, then render. */
  onFrame(millis: Millis, reason: LoopReason): 'Skip' | undefined {
    this.tick.ms = millis
    this.tick.s = (millis / 1000) as Secs
    if (document.hidden) return
    this.input.update(millis)

    // request frame before in case update cancels. next reason is 'Render' when
    // input.
    const nextReason = this.requestFrame()
    if (reason === 'Poll' && nextReason !== 'Render') return 'Skip'

    this.#invalid = false
    this.metrics.prev.draw = (this.renderer.drawEnd -
      this.renderer.drawStart) as Millis
    this.metrics.prev.update = this.metrics.update
    this.metrics.update = 0
    this.loader.update(this)

    this.cam.postupdate()
    this.metrics.prev.frame = (performance.now() -
      this.looper.frameStart) as Millis
  }

  onInterval(): void {
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

    if (op === 'add') this.requestFrame('Force')
    this.#interval?.register(op)

    await loadImage(this.#atlasImage)
    this.renderer.loadAtlas(this.#atlasImage)
    if (this.#tilesetImage) {
      await loadImage(this.#tilesetImage)
      this.renderer.loadTileset(this.#tilesetImage)
    }
    this.#registered = op === 'add'
  }

  requestFrame(force?: 'Force'): LoopReason | undefined {
    let reason: LoopReason | undefined
    if (force || this.input.invalid || this.input.anyOn || this.renderer.always)
      reason = 'Render'
    else if (this.input.gamepad) reason = 'Poll'

    if (reason) this.looper.requestFrame(reason)
    return reason
  }

  setInterval(period: Millis, delay?: () => Millis): void {
    this.#interval?.register('remove')
    this.#interval = new DelayInterval(delay ?? (() => 0), period, () =>
      this.onInterval()
    )
    if (this.#registered) this.#interval.register('add')
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.register('remove')
  }
}
