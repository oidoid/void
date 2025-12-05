import type {AnyTag} from '../graphics/atlas.ts'
import {Layer, layerOffset} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {type XY, xyEq} from '../types/geo.ts'
import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'
import {NinePatchEnt, type NinePatchOpts} from './nine-patch.ts'
import {TextEnt} from './text.ts'

export type ButtonOpts<Tag extends AnyTag> = {
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

export class ButtonEnt<Tag extends AnyTag, Button extends string>
  implements Ent<Tag>
{
  readonly #button: NinePatchEnt<Tag>
  #invalid: boolean = true
  readonly #pressed: Sprite<Tag>
  readonly #selected: Sprite<Tag>
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
    this.#pressed = v.alloc()
    this.#pressed.z = opts.pressed.z ?? layerOffset(buttonZ, -2)
    this.#selected = v.alloc()
    this.#selected.z = opts.selected.z ?? layerOffset(this.#pressed.z, 1)

    this.#pressed.tag = opts.pressed.tag
    this.#pressed.x = opts.x ?? 0
    this.#pressed.y = opts.y ?? 0
    this.#pressed.w = opts.w ?? this.#button.wh.w
    this.#pressed.h = opts.h ?? this.#button.wh.h

    this.#selected.tag = opts.selected.tag
    this.#selected.x = opts.x ?? 0
    this.#selected.y = opts.y ?? 0
    this.#selected.w = opts.w ?? this.#button.wh.w
    this.#selected.h = opts.h ?? this.#button.wh.h

    this.#text.text = opts.text?.text ?? ''
    this.#text.scale = opts.text?.scale ?? 1
    this.#text.layout(v)
    this.#moveText(v)
    this.#text.maxW = opts.w ?? this.#button.wh.w
    this.#text.z = opts.text?.z ?? layerOffset(buttonZ, 1)

    this.#toggle = opts.toggle ?? false
  }

  get selected(): boolean {
    return this.#selected.visible
  }

  free(): void {
    this.#button.free()
    this.#text.free()
    this.#selected.free()
    this.#pressed.free()
  }

  get on(): boolean {
    return this.#pressed.visible
  }

  set on(on: boolean) {
    this.#pressed.visible = on
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
      !v.input.handled && !!v.zoo.cursor?.hits(v, this.#selected, 'UI')
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

    const selected =
      hitsCursor && !!(v.input.point?.click || v.input.point?.type === 'Mouse')

    invalid ||= selected !== this.selected
    this.#selected.visible = selected

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
    this.#pressed.x = xy.x
    this.#pressed.y = xy.y
    this.#selected.x = xy.x
    this.#selected.y = xy.y
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
