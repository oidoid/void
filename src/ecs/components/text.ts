import { AsepriteFileTag, FilmByID } from '@/atlas-pack'
import { Box } from '@/ooz'
import { Font, fontCharToFilmID, layoutText, Sprite } from '@/void'

export class Text {
  readonly #bounds: Box
  readonly #font: Font
  readonly #layer: number
  #str: string
  #rendered: boolean

  constructor(bounds: Box, font: Font, layer: number, str: string) {
    this.#bounds = bounds
    this.#font = font
    this.#layer = layer
    this.#str = str
    this.#rendered = false
  }

  get layer(): number {
    return this.#layer
  }

  render<const FilmID extends AsepriteFileTag>(
    filmByID: FilmByID<FilmID>,
    layer: number,
  ): Sprite[] {
    const layout = layoutText(this.#font, this.#str, this.#bounds.w)
    this.#bounds.h = layout.cursor.y + this.#font.lineHeight
    const sprites = []
    for (const [i, char] of layout.chars.entries()) {
      if (char == null) continue
      const filmID = fontCharToFilmID<FilmID>(this.#font, this.#str[i]!)
      const sprite = new Sprite(
        filmByID[filmID],
        layer,
        this.#bounds.xy.copy().add(char.xy),
      )
      sprites.push(sprite)
    }
    this.#rendered = true
    return sprites
  }

  set str(str: string) {
    if (this.#str === str) return
    this.#str = str
    this.#rendered = false
  }

  get valid(): boolean {
    return this.#rendered
  }
}
