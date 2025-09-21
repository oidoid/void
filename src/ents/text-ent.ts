import {memProp5x6} from 'mem-font'
import type {TagFormat} from '../graphics/atlas.ts'
import {Layer} from '../graphics/layer.ts'
import type {Sprite} from '../graphics/sprite.ts'
import {fontCharToTag} from '../text/font.ts'
import {layoutText} from '../text/text-layout.ts'
import {type WH, type XY, xyEq} from '../types/geo.ts'
import type {VoidT} from '../void.ts'
import type {Ent} from './ent.ts'

export class TextEnt implements Ent {
  #maxW: number = Infinity
  #invalid: boolean = false
  #z: Layer = Layer.UIA
  #scale: number = 1
  readonly #sprites: Sprite<TagFormat>[] = []
  #str: string = ''
  #wh: WH = {w: 0, h: 0}
  readonly #xy: XY = {x: 0, y: 0}

  free(v: VoidT<string, TagFormat>): void {
    v.pool.free(...this.#sprites)
  }

  get maxW(): number {
    return this.#maxW
  }

  set maxW(w: number) {
    if (w === this.#maxW) return
    this.#maxW = w
    this.#invalid = true
  }

  get scale() {
    return this.#scale
  }

  set scale(scale: number) {
    if (scale === this.#scale) return
    this.#scale = scale
    this.#invalid = true
  }

  get text(): string {
    return this.#str
  }

  set text(str: string) {
    if (str === this.#str) return
    this.#str = str
    this.#invalid = true
  }

  update(v: VoidT<string, TagFormat>): boolean | undefined {
    if (!this.#invalid) return
    let len = 0
    const layout = layoutText({
      font: memProp5x6,
      maxW: this.#maxW,
      scale: this.#scale,
      start: this.#xy,
      str: this.#str
    })
    this.#wh = {w: layout.wh.w, h: layout.wh.h}
    for (const [i, char] of layout.chars.entries()) {
      if (char == null) continue
      const sprite = (this.#sprites[len] ??= v.pool.alloc())
      sprite.x = char.x
      sprite.y = char.y
      sprite.tag = fontCharToTag(memProp5x6, this.#str[i]!)
      sprite.stretch = true
      sprite.w *= this.#scale
      sprite.h *= this.#scale
      sprite.z = this.#z
      len++
    }
    while (this.#sprites.length > len) v.pool.free(this.#sprites.pop()!)
    this.#invalid = false
    return true
  }

  get wh(): Readonly<WH> {
    return this.#wh
  }

  get xy(): Readonly<XY> {
    return this.#xy
  }

  // to-do: support moving to an XY by an anchor (NW, N, NE, etc).
  set xy(xy: Readonly<XY>) {
    if (xyEq(xy, this.#xy)) return
    this.#xy.x = xy.x
    this.#xy.y = xy.y
    this.#invalid = true
  }

  get z(): Layer {
    return this.#z
  }

  set z(layer: Layer) {
    if (layer === this.#z) return
    this.#z = layer
    this.#invalid = true
  }
}
