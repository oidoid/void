import type {TagFormat} from '../graphics/atlas.ts'
import {Layer, layerOffset} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {type XY, xyEq} from '../types/geo.ts'
import type {Void} from '../void.ts'
import type {Ent} from './ent.ts'
import {NinePatchEnt, type NinePatchOpts} from './nine-patch-ent.ts'
import {TextEnt} from './text-ent.ts'

export type ButtonOpts<Tag extends TagFormat> = {
  background: Omit<NinePatchOpts<Tag>, 'x' | 'y' | 'wh'>
  pressed: Tag
  selected: Tag
  toggle?: boolean | undefined
  text?: string | undefined
  textScale?: number | undefined
  w?: number | undefined
  h?: number | undefined
  x?: number | undefined
  y?: number | undefined
}

export class ButtonEnt<Tag extends TagFormat, Button extends string>
  implements Ent
{
  readonly #bg: NinePatchEnt<Tag>
  #invalid: boolean = true
  readonly #pressed: Sprite<Tag>
  readonly #selected: Sprite<Tag>
  #started: boolean = false
  readonly #toggle: boolean = false
  readonly #text: TextEnt = new TextEnt()
  readonly #xy: XY = {x: 0, y: 0}
  readonly #foregroundZ: Layer

  constructor(v: Void<Tag, string>, opts: Readonly<ButtonOpts<Tag>>) {
    this.#bg = new NinePatchEnt(v, {
      ...opts.background,
      x: opts.x,
      y: opts.y,
      wh: {w: opts.w, h: opts.h}
    })
    this.#foregroundZ = layerOffset(opts.background.z ?? 0, -1)

    this.#pressed = v.sprites.alloc()
    this.#pressed.tag = opts.pressed
    this.#pressed.x = opts.x ?? 0
    this.#pressed.y = opts.y ?? 0 // to-do: allow setting props. constructor opts vs setters. seems a bit easier to chew setter + dynamic but maybe more code both in impl and callers
    this.#pressed.w = opts.w ?? this.#bg.wh.w
    this.#pressed.h = opts.h ?? this.#bg.wh.h
    this.#pressed.z = Layer.Hidden

    // to-do: review what I did when last making button
    // to-do: what does a global alloc simplify and make more complex?
    this.#selected = v.sprites.alloc()
    this.#selected.tag = opts.selected
    this.#selected.x = opts.x ?? 0
    this.#selected.y = opts.y ?? 0 // to-do: allow setting props. constructor opts vs setters. seems a bit easier to chew setter + dynamic but maybe more code both in impl and callers
    this.#selected.w = opts.w ?? this.#bg.wh.w
    this.#selected.h = opts.h ?? this.#bg.wh.h
    this.#selected.z = Layer.Hidden

    // to-do: layer. how to expose? just zend?
    this.#text.text = opts.text ?? ''
    this.#text.scale = opts.textScale ?? 1
    this.#text.update(v) // blach
    // to-do: do this in xy setter too.
    this.#text.xy = {
      x: this.#bg.xy.x + this.#bg.wh.w / 2 - this.#text.wh.w / 2,
      y:
        this.#bg.xy.y +
        this.#bg.wh.h / 2 -
        (this.#text.wh.h - this.#text.scaledLeading) / 2 // not crazy aobut wh. dot. want clarity on .w vs .wh.w for get and set.
      // don't like this leading logic here. want something more thoughtful like text metrics for when no ascenders, for example.
    }
    this.#text.maxW = opts.w ?? this.#bg.wh.w
    this.#text.z = this.#foregroundZ

    this.#toggle = opts.toggle ?? false
  }

  get selected(): boolean {
    return this.on || this.#selected.z !== Layer.Hidden
  }

  free(v: Void<Tag, string>): void {
    this.#bg.free(v)
    this.#text.free(v)
    // other stuff
    // to-do: review free elsewhere for composeod ents.
    v.sprites.free(this.#selected, this.#pressed)
  }

  // to-do: update UI after cursor so these getters make sense.
  get on(): boolean {
    return this.#pressed.z === this.#foregroundZ
  }

  get onStart(): boolean {
    return this.on && this.#started
  }

  set text(str: string) {
    this.#text.text = str // to-do: review update() is propagating invalid in update() elsewhere.
  }

  // to-do: center within button.
  // to-do: support moving to an XY by an anchor (NW, N, NE, etc).
  set xy(xy: Readonly<XY>) {
    if (xyEq(xy, this.#xy)) return
    this.#xy.x = xy.x
    this.#xy.y = xy.y
    this.#bg.xy = xy
    this.#text.xy = xy
    this.#pressed.xy = xy
    this.#selected.xy = xy
    this.#invalid = true
  }

  update(v: Void<Tag, 'A' | 'Click' | Button>): boolean | undefined {
    let invalid = this.#invalid
    if (this.#bg.update()) invalid = true
    if (this.#text.update(v)) invalid = true

    const hitsCursor =
      !v.input.handled && v.zoo.cursor?.hits(v, this.#selected, 'UI')

    const click =
      (hitsCursor && v.input.isAnyOnStart('A', 'Click')) ||
      (hitsCursor && v.input.isAnyOn('A', 'Click') && this.on)

    this.#started = this.on !== click
    if (click) {
      v.input.handled = true
      if ((this.#toggle && !this.on) || !this.#toggle) {
        invalid ||= this.#pressed.z !== this.#foregroundZ
        this.#pressed.z = this.#foregroundZ
      } else {
        invalid ||= this.#pressed.z !== Layer.Hidden
        this.#pressed.z = Layer.Hidden
      }
    } else {
      invalid ||= this.#pressed.z !== Layer.Hidden
      this.#pressed.z = Layer.Hidden
    }

    if (
      !click &&
      hitsCursor &&
      (v.input.point?.click || v.input.point?.type === 'Mouse')
    ) {
      invalid ||= this.#selected.z !== this.#foregroundZ
      this.#selected.z = this.#foregroundZ
    } else {
      invalid ||= this.#selected.z !== Layer.Hidden
      this.#selected.z = Layer.Hidden
    }

    this.#invalid = false
    return invalid
  }
}
// to-do: calling update out of band for text to reset size may cause a missed render. need to expose another mechanism.
