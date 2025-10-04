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
      sprite: v.sprites.alloc(),
      z: opts.pressed.z ?? layerOffset(buttonZ, 2)
    }
    this.#selected = {
      sprite: v.sprites.alloc(),
      z: opts.selected.z ?? layerOffset(this.#pressed.z, -1)
    }

    this.#pressed.sprite.tag = opts.pressed.tag
    this.#pressed.sprite.x = opts.x ?? 0
    this.#pressed.sprite.y = opts.y ?? 0 // to-do: allow setting props. constructor opts vs setters. seems a bit easier to chew setter + dynamic but maybe more code both in impl and callers
    this.#pressed.sprite.w = opts.w ?? this.#button.wh.w
    this.#pressed.sprite.h = opts.h ?? this.#button.wh.h
    this.#pressed.sprite.z = Layer.Hidden

    // to-do: review what I did when last making button
    // to-do: what does a global alloc simplify and make more complex?
    this.#selected.sprite.tag = opts.selected.tag
    this.#selected.sprite.x = opts.x ?? 0
    this.#selected.sprite.y = opts.y ?? 0 // to-do: allow setting props. constructor opts vs setters. seems a bit easier to chew setter + dynamic but maybe more code both in impl and callers
    this.#selected.sprite.w = opts.w ?? this.#button.wh.w
    this.#selected.sprite.h = opts.h ?? this.#button.wh.h
    this.#selected.sprite.z = Layer.Hidden

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
    v.sprites.free(this.#selected.sprite, this.#pressed.sprite)
  }

  // to-do: update UI after cursor so these getters make sense.
  get on(): boolean {
    return this.#pressed.sprite.z !== Layer.Hidden
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
      !v.input.handled && !!v.zoo.cursor?.hits(v, this.#selected.sprite, 'UI')
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
      this.#pressed.sprite.z = on ? this.#pressed.z : Layer.Hidden
      invalid = true
    }

    if (
      hitsCursor &&
      (v.input.point?.click || v.input.point?.type === 'Mouse')
    ) {
      invalid ||= this.#selected.sprite.z !== this.#selected.z
      this.#selected.sprite.z = this.#selected.z
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
    this.#pressed.sprite.xy = xy
    this.#selected.sprite.xy = xy
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
