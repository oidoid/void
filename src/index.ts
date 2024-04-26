// ───oidoid>°──
import type {Anim, TagFormat} from './atlas/anim.js'
import type {Atlas} from './atlas/atlas.js'
import {Synth} from './audio/synth.js'
import {BitmapBuffer, type Bitmap} from './graphics/bitmap.js'
import {Cam} from './graphics/cam.js'
import {FrameListener} from './graphics/frame-listener.js'
import {Renderer} from './graphics/renderer.js'
import {Input, type StandardButton} from './input/input.js'
import {Sprite} from './sprite/sprite.js'
import {JSONStorage} from './storage/json-storage.js'
import {debug} from './types/debug.js'

export type {Font} from 'mem-font'
export type {Config} from './atlas/config.js'
export type {SpriteJSON} from './sprite/sprite.js'
export {fontCharToTag} from './text/font.js'
export {layoutText, type TextLayout} from './text/text-layout.js'
export type {Box, WH, XY} from './types/2d.js'
export {Sprite}
export type {Anim, Atlas, StandardButton, TagFormat}

declare const atlas: Atlas<TagFormat>
declare const atlasURI: string

export class Void<Tag extends TagFormat, Button extends string> {
  static async new<Tag extends TagFormat, Button extends string>(): Promise<
    Void<Tag, Button>
  > {
    return new Void(<Atlas<Tag>>atlas, await loadImage(atlasURI))
  }

  readonly atlas: Atlas<Tag> = <Atlas<Tag>>atlas
  readonly debug: boolean = debug
  readonly cam: Cam = new Cam()
  readonly ctrl: Input<Button>
  readonly kv: JSONStorage = new JSONStorage()
  readonly synth: Synth = new Synth()

  readonly #bitmaps: BitmapBuffer = new BitmapBuffer(1_000_000)
  readonly #framer: FrameListener
  readonly #renderer: Renderer

  constructor(atlas: Atlas<Tag>, atlasImage: HTMLImageElement) {
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
    canvas.width = 0 // Guarantee Renderer.#resize().
    canvas.style.cursor = 'none'
    canvas.style.display = 'block' // No line height spacing.
    canvas.style.imageRendering = 'pixelated'
    // Update on each pointermove *touch* Event like *mouse* Events.
    canvas.style.touchAction = 'none'
    document.body.append(canvas)

    this.ctrl = new Input(this.cam, canvas)
    this.#renderer = new Renderer(atlas, canvas, atlasImage)
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
