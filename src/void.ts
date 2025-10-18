import {Zoo} from './ents/zoo.ts'
import type {Atlas, AtlasJSON, TagFormat} from './graphics/atlas.ts'
import {parseAtlas} from './graphics/atlas-parser.ts'
import {Cam} from './graphics/cam.ts'
import {Renderer} from './graphics/renderer.ts'
import {drawableBytes, Sprite} from './graphics/sprite.ts'
import {type DefaultButton, Input} from './input/input.ts'
import {Looper} from './looper.ts'
import {Pool, type PoolOpts} from './mem/pool.ts'
import {PixelRatioObserver} from './pixel-ratio-observer.ts'
import type {WH} from './types/geo.ts'
import type {Millis} from './types/time.ts'
import {initCanvas} from './utils/canvas-util.ts'
import {initBody, initMetaViewport} from './utils/dom-util.ts'
import {loadImage} from './utils/fetch-util.ts'

export type VoidOpts<out Tag extends TagFormat> = {
  preloadAtlas?: {image: HTMLImageElement; json: AtlasJSON} | undefined
  backgroundRGBA?: number
  canvas?: HTMLCanvasElement | undefined
  minWH?: WH | undefined
  input?: 'Custom' | 'Default' | undefined
  mode?: 'Int' | 'Fraction' | undefined
  sprites?:
    | Partial<Omit<PoolOpts<Sprite<Tag>>, 'alloc' | 'allocBytes'>>
    | undefined
}

export class Void<
  out Tag extends TagFormat,
  Button extends string = DefaultButton
> {
  readonly cam: Cam = new Cam()
  readonly canvas: HTMLCanvasElement
  readonly framer: Looper = new Looper()
  readonly input: Input<Button>
  readonly preload: Atlas
  readonly renderer: Renderer
  readonly sprites: Pool<Sprite<Tag>>
  readonly zoo: Zoo<Tag> = new Zoo()
  readonly #pixelRatioObserver: PixelRatioObserver = new PixelRatioObserver()
  readonly #preloadAtlasImage: HTMLImageElement | undefined
  readonly #resizeObserver = new ResizeObserver(() => this.onResize())

  constructor(opts: Readonly<VoidOpts<Tag>>) {
    initMetaViewport()
    this.canvas = initCanvas(opts.canvas, opts.mode ?? 'Int')
    initBody(this.canvas, opts.backgroundRGBA ?? 0x000000ff)

    if (opts.minWH) this.cam.minWH = opts.minWH
    this.cam.mode = opts.mode ?? 'Int'
    this.cam.update(this.canvas)

    this.input = new Input(this.cam, this.canvas)
    if (opts.input !== 'Custom') this.input.mapDefault()
    this.input.onEvent = () => this.onEvent()

    this.#pixelRatioObserver.onChange = () => this.onResize()

    if (opts.preloadAtlas) this.#preloadAtlasImage = opts.preloadAtlas.image

    this.preload = opts.preloadAtlas
      ? parseAtlas(opts.preloadAtlas.json)
      : {anim: {}, celXYWH: [], tags: []}

    this.renderer = new Renderer(this.preload ?? {}, this.canvas)

    this.sprites = new Pool<Sprite<Tag>>({
      alloc: pool => this.onAllocSprite(pool),
      allocBytes: drawableBytes,
      minPages: opts.sprites?.minPages ?? 3,
      pageBlocks: opts.sprites?.pageBlocks ?? 1000
    })

    this.framer.onFrame = millis => this.onFrame(millis)
  }

  onAllocSprite(pool: Pool<Sprite<TagFormat>>): Sprite<Tag> {
    return new Sprite(pool, 0, this.preload, this.framer)
  }

  onEvent(): void {
    this.framer.requestFrame()
  }

  /** update input, update canvas, update cam, update world, then render. */
  onFrame(millis: Millis): void {
    if (document.hidden) return
    this.input.update(millis)

    this.onLoop(millis)

    this.cam.postupdate()
  }

  // biome-ignore lint/correctness/noUnusedFunctionParameters:;
  onLoop(millis: Millis): void {}

  onResize(): void {
    this.framer.requestFrame()
  }

  async register(op: 'add' | 'remove'): Promise<void> {
    this.input.register(op)
    this.renderer.register(op)
    this.framer.register(op)
    if (!this.canvas.parentElement) throw Error('no canvas parent')
    if (op === 'add') this.#resizeObserver.observe(this.canvas.parentElement)
    else this.#resizeObserver.unobserve(this.canvas.parentElement)
    this.#pixelRatioObserver.register(op)

    this.framer.requestFrame()

    if (this.#preloadAtlasImage) await loadImage(this.#preloadAtlasImage)
    this.renderer.load(this.#preloadAtlasImage)
  }

  requestFrame(): void {
    if (this.renderer.always || this.input.anyOn || this.input.gamepad)
      this.framer.requestFrame()
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.register('remove')
  }
}
