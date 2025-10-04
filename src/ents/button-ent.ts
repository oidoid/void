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
  pressed: {tag: Tag; z?: Layer | undefined}
  selected: {tag: Tag; z?: Layer | undefined}
  toggle?: boolean | undefined
  text?:
    | {
        text?: string | undefined
        scale?: number | undefined
        z?: Layer | undefined
      }
    | undefined
  w?: number | undefined
  h?: number | undefined
  x?: number | undefined
  y?: number | undefined
}

export class ButtonEnt<Tag extends TagFormat, Button extends string>
  implements Ent
{
  readonly #button: NinePatchEnt<Tag>
  #invalid: boolean = true
  readonly #pressed: Sprite<Tag>
  readonly #pressedZ: Layer
  readonly #selected: Sprite<Tag>
  readonly #selectedZ: Layer
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
    this.#pressedZ = opts.pressed.z ?? layerOffset(buttonZ, 2)
    this.#selectedZ = opts.selected.z ?? layerOffset(this.#pressedZ, -1)

    this.#pressed = v.sprites.alloc()
    this.#pressed.tag = opts.pressed.tag
    this.#pressed.x = opts.x ?? 0
    this.#pressed.y = opts.y ?? 0 // to-do: allow setting props. constructor opts vs setters. seems a bit easier to chew setter + dynamic but maybe more code both in impl and callers
    this.#pressed.w = opts.w ?? this.#button.wh.w
    this.#pressed.h = opts.h ?? this.#button.wh.h
    this.#pressed.z = Layer.Hidden

    // to-do: review what I did when last making button
    // to-do: what does a global alloc simplify and make more complex?
    this.#selected = v.sprites.alloc()
    this.#selected.tag = opts.selected.tag
    this.#selected.x = opts.x ?? 0
    this.#selected.y = opts.y ?? 0 // to-do: allow setting props. constructor opts vs setters. seems a bit easier to chew setter + dynamic but maybe more code both in impl and callers
    this.#selected.w = opts.w ?? this.#button.wh.w
    this.#selected.h = opts.h ?? this.#button.wh.h
    this.#selected.z = Layer.Hidden

    // to-do: layer. how to expose? just zend?
    this.#text.text = opts.text?.text ?? ''
    this.#text.scale = opts.text?.scale ?? 1
    this.#text.layout(v)
    this.#moveText()
    this.#text.maxW = opts.w ?? this.#button.wh.w
    this.#text.z = opts.text?.z ?? layerOffset(buttonZ, -1)

    this.#toggle = opts.toggle ?? false
  }

  get selected(): boolean {
    return this.#selected.z !== Layer.Hidden
  }

  free(v: Void<Tag, string>): void {
    this.#button.free(v)
    this.#text.free(v)
    // other stuff
    // to-do: review free elsewhere for composeod ents.
    v.sprites.free(this.#selected, this.#pressed)
  }

  // to-do: update UI after cursor so these getters make sense.
  get on(): boolean {
    return this.#pressed.z !== Layer.Hidden
  }

  get onStart(): boolean {
    return this.on && this.#started
  }

  set text(str: string) {
    this.#text.text = str // to-do: review update() is propagating invalid in update() elsewhere.
  }

  update(v: Void<Tag, 'A' | 'Click' | Button>): boolean | undefined {
    let invalid = this.#invalid
    if (this.#button.update()) invalid = true
    if (this.#text.update(v)) invalid = true

    const hitsCursor =
      !v.input.handled && !!v.zoo.cursor?.hits(v, this.#selected, 'UI')
    const clickStarted = hitsCursor && v.input.isAnyOnStart('A', 'Click')

    const on = clickStarted
      ? this.#toggle
        ? !this.on
        : true
      : this.#toggle
        ? this.on
        : v.input.isAnyOn('A', 'Click')
    this.#started = this.on !== on
    if (this.#started) {
      this.#pressed.z = on ? this.#pressedZ : Layer.Hidden
      invalid = true
    }

    if (
      hitsCursor &&
      (v.input.point?.click || v.input.point?.type === 'Mouse')
    ) {
      invalid ||= this.#selected.z !== this.#selectedZ
      this.#selected.z = this.#selectedZ
    } else {
      invalid ||= this.#selected.z !== Layer.Hidden
      this.#selected.z = Layer.Hidden
    }

    v.input.handled ||= hitsCursor
    this.#invalid = false
    return invalid
  }

  // to-do: center within button.
  // to-do: support moving to an XY by an anchor (NW, N, NE, etc).
  set xy(xy: Readonly<XY>) {
    if (xyEq(xy, this.#xy)) return
    this.#xy.x = xy.x
    this.#xy.y = xy.y
    this.#button.xy = xy
    this.#moveText()
    this.#pressed.xy = xy
    this.#selected.xy = xy
    this.#invalid = true
  }

  #moveText(): void {
    this.#text.xy = {
      x: this.#button.xy.x + this.#button.wh.w / 2 - this.#text.wh.w / 2,
      y:
        this.#button.xy.y +
        this.#button.wh.h / 2 -
        (this.#text.wh.h - this.#text.scaledLeading) / 2 // not crazy aobut wh. dot. want clarity on .w vs .wh.w for get and set.
      // don't like this leading logic here. want something more thoughtful like text metrics for when no ascenders, for example.
    }
  }
}
// to-do: calling update out of band for text to reset size may cause a missed render. need to expose another mechanism.
