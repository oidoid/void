import {memProp5x6} from 'mem-font'
import type {TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {fontCharToTag} from '../text/font.ts'
import {layoutText} from '../text/text-layout.ts'
import {type XY, xyEq} from '../types/geo.ts'
import type {VoidT} from '../void.ts'
import type {EID, EIDFactory} from './eid.ts'
import type {Ent} from './ent.ts'

// to-do: publish Aseprite so it can be included in atlas.
export class TextEnt<T extends TagFormat> implements Ent {
  readonly eid: EID
  #maxW: number = Infinity
  #invalid: boolean = false
  #scale: number = 1
  readonly #sprites: Sprite<T>[] = []
  #text: string = ''
  readonly #xy: XY = {x: 0, y: 0}

  constructor(factory: EIDFactory) {
    this.eid = factory.new()
  }

  set maxW(w: number) {
    if (w === this.#maxW) return
    this.#maxW = w
    this.#invalid = true
  }

  set scale(scale: number) {
    if (scale === this.#scale) return
    this.#scale = scale
    this.#invalid = true
  }

  set text(str: string) {
    if (str === this.#text) return
    this.#text = str
    this.#invalid = true
  }

  // to-do: support moving to an XY by an anchor (NW, N, NE, etc).
  set xy(xy: Readonly<XY>) {
    if (xyEq(xy, this.#xy)) return
    this.#xy.x = xy.x
    this.#xy.y = xy.y
    this.#invalid = true
  }

  update(v: VoidT<string, T>): boolean | undefined {
    if (!this.#invalid) return
    let spriteI = 0
    const layout = layoutText({
      font: memProp5x6,
      maxW: this.#maxW,
      scale: this.#scale,
      start: this.#xy,
      str: this.#text
    })
    for (const [i, char] of layout.chars.entries()) {
      if (char == null) continue
      const sprite = (this.#sprites[spriteI] ??= v.pool.alloc())
      sprite.x = char.x
      sprite.y = char.y
      sprite.tag = fontCharToTag(memProp5x6, this.#text[i]!) as T
      sprite.stretch = true
      sprite.w *= this.#scale
      sprite.h *= this.#scale
      sprite.z = Layer.UIA // to-do: expose.
      spriteI++
    }
    while (this.#sprites.length > spriteI) v.pool.free(this.#sprites.pop()!)
    return true
  }
}
