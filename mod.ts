// ─── oidoid >°──
import { AnimTag } from './src/atlas/aseprite.ts'
import { Atlas } from './src/atlas/atlas.ts'
import { Synth } from './src/audio/synth.ts'
import { Bitmap, BitmapBuffer } from './src/graphics/bitmap.ts'
import { Cam } from './src/graphics/cam.ts'
import { FrameListener } from './src/graphics/frame-listener.ts'
import { Renderer } from './src/graphics/renderer.ts'
import { Input, StandardButton } from './src/input/input.ts'
import { Sprite } from './src/sprite/sprite.ts'
import { JSONStorage } from './src/storage/json-storage.ts'

export type { AnimTag } from './src/atlas/aseprite.ts'
export type { Atlas } from './src/atlas/atlas.ts'
export { Sprite } from './src/sprite/sprite.ts'
export type { SpriteJSON } from './src/sprite/sprite.ts'
export type { Box, WH, XY } from './src/types/2d.ts'
export { NonNull } from './src/types/nonnull.ts'

declare const atlas: Atlas
declare const atlasURI: string

export class Void<
  Tag extends AnimTag = AnimTag,
  Button extends string = StandardButton,
> {
  static async new<
    Tag extends AnimTag = AnimTag,
    Button extends string = StandardButton,
  >(): Promise<Void<Tag, Button>> {
    return new Void(await loadImage(atlasURI))
  }

  readonly atlas: Atlas<Tag> = atlas as Atlas<Tag>
  readonly cam: Cam = new Cam()
  readonly ctrl: Input<Button>
  readonly kv = new JSONStorage()
  readonly synth = new Synth()

  readonly #bitmaps: BitmapBuffer = new BitmapBuffer(1_000_000)
  readonly #framer: FrameListener
  readonly #renderer: Renderer

  constructor(spritesheet: HTMLImageElement) {
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    // Don't wait for double-tap scaling on mobile.
    meta.content = 'maximum-scale=1, minimum-scale=1, user-scalable=no'
    document.head.appendChild(meta)

    document.body.style.margin = '0'
    document.body.style.width = '100vw'
    document.body.style.height = '100vh'
    document.body.style.overflow = 'hidden'

    const canvas = document.createElement('canvas')
    canvas.style.cursor = 'none'
    canvas.style.display = 'block' // No line height spacing.
    canvas.style.imageRendering = 'pixelated'
    // Update on each pointermove *touch* Event like *mouse* Events.
    canvas.style.touchAction = 'none'
    document.body.append(canvas)

    this.ctrl = new Input(this.cam, canvas)
    this.#renderer = new Renderer(atlas, canvas, spritesheet)
    this.#framer = new FrameListener(canvas, this.ctrl, this.#renderer)
    this.#framer.register('add')
    this.background = 0x000000ff
  }

  set background(rgba: number) {
    document.body.style.background = `#${rgba.toString(16).padStart(8, '0')}`
    this.#renderer.clearColor(rgba)
  }

  blit(bmp: Readonly<Bitmap>): void {
    this.#bitmaps.push(bmp)
  }

  get frame(): number {
    return this.#framer.frame
  }

  render(loop?: () => void): void {
    this.cam.resize()
    this.#framer.render(this.cam, this.#bitmaps, loop)
    this.#bitmaps.size = 0
  }

  sprite(tag: Tag): Sprite<Tag> {
    return new Sprite<Tag>(this.atlas, tag)
  }

  stop(): void {
    this.#framer.cancel()
    this.#framer.register('remove')
    this.ctrl.register('remove')
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(img)
    img.src = src
  })
}
