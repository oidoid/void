import {Zoo} from './ents/zoo.ts'
import {Framer} from './framer.ts'
import type {Atlas, AtlasJSON, TagFormat} from './graphics/atlas.ts'
import {parseAtlas} from './graphics/atlas-parser.ts'
import {Cam} from './graphics/cam.ts'
import {Renderer} from './graphics/renderer.ts'
import {drawableBytes, Sprite} from './graphics/sprite.ts'
import {type DefaultButton, Input} from './input/input.ts'
import {Pool, type PoolOpts} from './mem/pool.ts'
import type {WH} from './types/geo.ts'
import type {Millis} from './types/time.ts'
import {initCanvas} from './utils/canvas-util.ts'
import {initBody, initMetaViewport} from './utils/dom-util.ts'
import {fetchImage} from './utils/fetch-util.ts'

export type VoidOpts<out Tag extends TagFormat> = {
  atlasImageURI: string
  atlasJSON: AtlasJSON
  backgroundRGBA?: number
  canvas?: HTMLCanvasElement | undefined
  minWH?: WH | undefined
  input?: 'Custom' | 'Default' | undefined
  mode?: 'Int' | 'Fraction' | undefined
  sprites?:
    | Partial<Omit<PoolOpts<Sprite<Tag>>, 'alloc' | 'allocBytes'>>
    | undefined
}

// to-do: do this declaration merging for Atlas and Sprite too so everything is implied when
//        Void is used over VoidT. don't think I can do classes like Input and Sprite.

export class Void<
  out Tag extends TagFormat,
  Button extends string = DefaultButton
> {
  readonly atlas: Atlas
  readonly cam: Cam = new Cam()
  readonly canvas: HTMLCanvasElement
  readonly framer: Framer = new Framer()
  readonly renderer: Renderer
  readonly input: Input<Button>
  readonly sprites: Pool<Sprite<Tag>>
  readonly zoo: Zoo<Tag> = new Zoo()
  readonly #atlasImageURI: string
  readonly #resizeObserver = new ResizeObserver(() => this.onResize())

  constructor(opts: Readonly<VoidOpts<Tag>>) {
    initMetaViewport()
    this.canvas = initCanvas(opts.canvas, opts.mode ?? 'Int')
    initBody(this.canvas, opts.backgroundRGBA ?? 0x000000ff)

    if (opts.minWH) this.cam.minWH = opts.minWH
    this.cam.mode = opts.mode ?? 'Int'

    this.input = new Input(this.cam, this.canvas)
    if (opts.input !== 'Custom') this.input.mapDefault()
    this.input.onEvent = () => this.onEvent()

    this.#atlasImageURI = opts.atlasImageURI
    this.atlas = parseAtlas(opts.atlasJSON)

    this.renderer = new Renderer(this.atlas, this.canvas)

    this.sprites = new Pool<Sprite<Tag>>({
      alloc: pool => this.onAllocSprite(pool),
      allocBytes: drawableBytes,
      minPages: opts.sprites?.minPages ?? 3,
      pageBlocks: opts.sprites?.pageBlocks ?? 1000
    })

    this.framer.onFrame = millis => this.onFrame(millis)
  }

  onAllocSprite(pool: Pool<Sprite<TagFormat>>): Sprite<Tag> {
    return new Sprite(pool, 0, this.atlas, this.framer)
  }

  onEvent(): void {
    this.framer.requestFrame()
  }

  onFrame(millis: Millis): void {
    if (document.hidden) return
    this.input.update(millis)
    this.cam.update(this.canvas)

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

    this.framer.requestFrame()

    this.renderer.load(await fetchImage(this.#atlasImageURI))
  }

  [Symbol.dispose](): void {
    this.register('remove')
  }
}
