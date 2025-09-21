import type {TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {type XY, xyEq} from '../types/geo.ts'
import type {VoidT} from '../void.ts'
import type {Ent} from './ent.ts'
import {NinePatchEnt, type NinePatchOpts} from './nine-patch-ent.ts'
import {TextEnt} from './text-ent.ts'

// to-do: construct Atlas.tags with Object.keys(), move XY to Anim, unroll
//        Atlas.cels pattern at execution.

export type ButtonOpts<Tag extends TagFormat> = NinePatchOpts<Tag> & {
  pressed: Tag
  selected: Tag
  toggle?: boolean
  text?: string
  textScale?: number
}

export class ButtonEnt<Tag extends TagFormat> implements Ent {
  readonly #bg: NinePatchEnt<Tag>
  #invalid: boolean = true
  readonly #pressed: Sprite<Tag>
  readonly #selected: Sprite<Tag>
  readonly #toggle: boolean = false
  readonly #text: TextEnt = new TextEnt()
  readonly #xy: XY = {x: 0, y: 0}

  constructor(v: VoidT<string, Tag>, opts: Readonly<ButtonOpts<Tag>>) {
    this.#bg = new NinePatchEnt(v, opts)

    this.#pressed = v.pool.alloc()
    this.#pressed.tag = opts.pressed
    this.#pressed.x = opts.x ?? 0
    this.#pressed.y = opts.y ?? 0 // to-do: allow setting props. constructor opts vs setters. seems a bit easier to chew setter + dynamic but maybe more code both in impl and callers
    this.#pressed.w = opts.wh?.w ?? this.#pressed.w
    this.#pressed.h = opts.wh?.h ?? this.#pressed.h
    this.#pressed.z = Layer.Hidden

    // to-do: review what I did when last making button
    // to-do: what does a global alloc simplify and make more complex?
    this.#selected = v.pool.alloc()
    this.#selected.tag = opts.selected
    this.#selected.x = opts.x ?? 0
    this.#selected.y = opts.y ?? 0 // to-do: allow setting props. constructor opts vs setters. seems a bit easier to chew setter + dynamic but maybe more code both in impl and callers
    this.#selected.w = opts.wh?.w ?? this.#bg.wh.w
    this.#selected.h = opts.wh?.h ?? this.#bg.wh.h
    this.#selected.z = Layer.Hidden

    // to-do: layer. how to expose? just zend?
    this.#text.text = opts.text ?? ''
    this.#text.scale = opts.textScale ?? 1
    this.#text.xy = {x: opts.x ?? 0, y: opts.y ?? 0} // to-do: actually want this on origin xy and limit to origin wh
    this.#text.maxW = opts.wh?.w ?? this.#bg.wh.w
    this.#text.z = Layer.UIA

    this.#toggle = opts.toggle ?? false
  }

  // get selected(): boolean {
  //   return this.#selected.z !== Layer.Hidden
  // }

  // // to-do: can i compute in update instead of farming out?
  // set selected(selected: boolean) {
  //   if (selected === this.selected) return
  //   this.#selected.z = Layer.UIB // to-do: expose.
  //   this.#invalid = true
  // }

  free(v: VoidT<string, Tag>): void {
    this.#bg.free(v)
    this.#text.free(v)
    // other stuff
    // to-do: review free elsewhere for composeod ents.
    v.pool.free(this.#selected)
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

  update(v: VoidT<string, Tag>): boolean | undefined {
    // to-do: prefer checking the cursor ent always. it can be moved by keyboard
    // in some cases and the only downside is that it must be updated first.
    // if (v.input.point?.invalid && v.input.point.click)

    let invalid = this.#invalid
    if (this.#bg.update(v)) invalid = true
    if (this.#text.update(v)) invalid = true

    const hitsCursor = v.zoo.cursor?.hits(v, this.#selected, 'UI')
    if (hitsCursor && this.#selected.z !== Layer.Top) {
      this.#selected.z = Layer.UIA
      invalid = true
    } else if (!hitsCursor && this.#selected.z !== Layer.Hidden) {
      this.#selected.z = Layer.Hidden
      invalid = true
    }

    if (hitsCursor && v.input.isAnyOnStart('A', 'Click')) {
      if (this.#toggle) this.#pressed
      invalid = true
    }

    if (!invalid) return

    this.#invalid = false
    return true
  }
}
