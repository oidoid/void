import { Aseprite, FilmByID } from '@/atlas-pack'
import { I16, I16Box, U8 } from '@/oidlib'
import { Font, Sprite, TextLayout } from '@/void'

export class Text {
  readonly #bounds: I16Box
  readonly #font: Font
  readonly #layer: U8
  #str: string
  #rendered: boolean

  constructor(bounds: I16Box, font: Font, layer: U8, str: string) {
    this.#bounds = bounds
    this.#font = font
    this.#layer = layer
    this.#str = str
    this.#rendered = false
  }

  get layer(): U8 {
    return this.#layer
  }

  render<FilmID extends Aseprite.Tag>(
    filmByID: FilmByID<FilmID>,
    layer: U8,
  ): Sprite[] {
    const layout = TextLayout.layout(this.#font, this.#str, this.#bounds.w)
    this.#bounds.h = I16.trunc(layout.cursor.y + this.#font.lineHeight)
    const sprites = []
    for (const [i, char] of layout.chars.entries()) {
      if (char == null) continue
      const filmID = Font.charToFilmID<FilmID>(this.#font, this.#str[i]!)
      const sprite = new Sprite(
        filmByID[filmID],
        layer,
        this.#bounds.xy.copy().addTrunc(char.xy),
      )
      sprites.push(sprite)
    }
    this.#rendered = true
    return sprites
  }

  set str(str: string) {
    if (this.#str == str) return
    this.#str = str
    this.#rendered = false
  }

  get valid(): boolean {
    return this.#rendered
  }
}
