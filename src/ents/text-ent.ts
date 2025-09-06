import {memProp5x6} from 'mem-font'
import type {TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import type {Input} from '../input/input.ts'
import type {Pool} from '../mem/pool.ts'
import {fontCharToTag} from '../text/font.ts'
import {layoutText} from '../text/text-layout.ts'
import {type XY, xyAddTo, xySub} from '../types/geo.ts'
import type {EID, EIDFactory} from './eid.ts'
import type {Ent} from './ent.ts'

// to-do: publish Aseprite so it can be included in atlas.
export class TextEnt<T extends TagFormat> implements Ent {
  readonly eid: EID
  #maxW: number = Infinity
  #invalid: boolean = false
  readonly #sprites: Sprite<T>[] = []
  #text: string = ''
  readonly #xy: XY = {x: 0, y: 0}

  constructor(factory: EIDFactory) {
    this.eid = factory.new()
  }

  set maxW(w: number) {
    this.#maxW = w
    this.#invalid = true
  }

  setText(str: string): void {
    this.#text = str
    this.#invalid = true
  }

  // to-do: support moving to an XY by an anchor (NW, N, NE, etc).
  move(xy: Readonly<XY>): void {
    const delta = xySub(xy, this.#xy)
    this.#xy.x = xy.x
    this.#xy.y = xy.y
    for (const char of this.#sprites) xyAddTo(char, delta)
  }

  update(_input: Input<string>, pool?: Pool<Sprite<T>>): void {
    if (!pool) throw Error('fuck')
    if (!this.#invalid) return
    let spriteI = 0
    const layout = layoutText(memProp5x6, this.#text, this.#maxW, this.#xy) // to-do: scale.
    for (const [i, char] of layout.chars.entries()) {
      if (char == null) continue
      const sprite = (this.#sprites[spriteI] ??= pool.alloc())
      sprite.x = char.x
      sprite.y = char.y
      sprite.tag = fontCharToTag(memProp5x6, this.#text[i]!) as T
      sprite.z = Layer.UIA // to-do: expose.
      spriteI++
    }
    while (this.#sprites.length > spriteI) pool.free(this.#sprites.pop()!)
  }
}
