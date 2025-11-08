import type {TagFormat} from '../graphics/atlas.ts'
import {Layer, layerOffset} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {type XY, xyEq} from '../types/geo.ts'
import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'
import {NinePatchEnt, type NinePatchOpts} from './nine-patch-ent.ts'
import {TextEnt} from './text-ent.ts'

export type ButtonOpts<Tag extends TagFormat> = {
  button: Omit<NinePatchOpts<Tag>, 'x' | 'y' | 'wh'>
  pressed: {tag: Tag; z?: Layer}
  selected: {tag: Tag; z?: Layer}
  toggle?: boolean
  text?: {text?: string; scale?: number; z?: Layer}
  w?: number
  h?: number
  x?: number
  y?: number
}

export class ButtonEnt<Tag extends TagFormat, Button extends string>
  implements Ent<Tag>
{
  readonly #button: NinePatchEnt<Tag>
  #invalid: boolean = true
  readonly #pressed: {sprite: Sprite<Tag>; z: Layer}
  readonly #selected: {sprite: Sprite<Tag>; z: Layer}
  #started: boolean = false
  readonly #toggle: boolean = false
  readonly #text: TextEnt = new TextEnt()
  readonly #xy: XY = {x: 0, y: 0}

  constructor(v: Void<Tag, string>, opts: Readonly<ButtonOpts<Tag>>) {
    const buttonZ = opts.button.z ?? Layer.UID
    this.#button = new NinePatchEnt(v, {
      ...opts.button,
      x: opts.x,
      y: opts.y,
      z: buttonZ,
      wh: {w: opts.w, h: opts.h}
    })
    this.#pressed = {
      sprite: v.pool.default.alloc(),
      z: opts.pressed.z ?? layerOffset(buttonZ, -2)
    }
    this.#selected = {
      sprite: v.pool.default.alloc(),
      z: opts.selected.z ?? layerOffset(this.#pressed.z, 1)
    }

    this.#pressed.sprite.tag = opts.pressed.tag
    this.#pressed.sprite.x = opts.x ?? 0
    this.#pressed.sprite.y = opts.y ?? 0
    this.#pressed.sprite.w = opts.w ?? this.#button.wh.w
    this.#pressed.sprite.h = opts.h ?? this.#button.wh.h
    this.#pressed.sprite.z = Layer.Hidden

    this.#selected.sprite.tag = opts.selected.tag
    this.#selected.sprite.x = opts.x ?? 0
    this.#selected.sprite.y = opts.y ?? 0
    this.#selected.sprite.w = opts.w ?? this.#button.wh.w
    this.#selected.sprite.h = opts.h ?? this.#button.wh.h
    this.#selected.sprite.z = Layer.Hidden

    this.#text.text = opts.text?.text ?? ''
    this.#text.scale = opts.text?.scale ?? 1
    this.#text.layout(v)
    this.#moveText(v)
    this.#text.maxW = opts.w ?? this.#button.wh.w
    this.#text.z = opts.text?.z ?? layerOffset(buttonZ, 1)

    this.#toggle = opts.toggle ?? false
  }

  get selected(): boolean {
    return this.#selected.z !== Layer.Hidden
  }

  free(): void {
    this.#button.free()
    this.#text.free()
    this.#selected.sprite.free()
    this.#pressed.sprite.free()
  }

  get on(): boolean {
    return this.#pressed.sprite.z !== Layer.Hidden
  }

  set on(on: boolean) {
    this.#pressed.sprite.z = on ? this.#pressed.z : Layer.Hidden
  }

  // to-do: offStart() for pointer up listen? would need a boundary check too.
  get onStart(): boolean {
    return this.on && this.#started
  }

  set text(str: string) {
    this.#text.text = str
  }

  update(v: Void<Tag, 'A' | 'Click' | Button>): boolean | undefined {
    let invalid = this.#invalid
    if (this.#button.update()) invalid = true
    if (this.#text.update(v)) invalid = true

    const hitsCursor =
      !v.input.handled && !!v.zoo.cursor?.hits(v, this.#selected.sprite, 'UI')
    const clickStarted =
      (hitsCursor && v.input.isOnStart('Click')) ||
      (v.zoo.cursor?.keyboard && v.input.isOnStart('A'))

    const on = clickStarted
      ? this.#toggle
        ? !this.on
        : true
      : this.#toggle
        ? this.on
        : v.input.isOn('Click') ||
          (!!v.zoo.cursor?.keyboard && v.input.isOn('A'))
    this.#started = this.on !== on
    if (this.#started) {
      this.on = on
      invalid = true
    }

    if (
      hitsCursor &&
      (v.input.point?.click || v.input.point?.type === 'Mouse')
    ) {
      invalid ||= this.#selected.sprite.z !== this.#selected.z
      this.#selected.sprite.z = this.#selected.z
    } else {
      invalid ||= this.#selected.sprite.z !== Layer.Hidden
      this.#selected.sprite.z = Layer.Hidden
    }

    v.input.handled ||= hitsCursor
    this.#invalid = false
    return invalid
  }

  setXY(v: Void<Tag, string>, xy: Readonly<XY>): void {
    if (xyEq(xy, this.#xy)) return
    this.#xy.x = xy.x
    this.#xy.y = xy.y
    this.#button.xy = xy
    this.#moveText(v)
    this.#pressed.sprite.xy = xy
    this.#selected.sprite.xy = xy
    this.#invalid = true
  }

  #moveText(v: Void<Tag, string>): void {
    this.#text.layout(v)
    this.#text.xy = {
      x: this.#button.xy.x + this.#button.wh.w / 2 - this.#text.wh.w / 2,
      y:
        this.#button.xy.y +
        this.#button.wh.h / 2 -
        (this.#text.wh.h - this.#text.scaledLeading) / 2
    }
  }
}
