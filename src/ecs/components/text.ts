import { AsepriteFileTag, FilmByID } from '@/atlas-pack'
import { XY } from '@/ooz'
import { Font, fontCharToFilmID, layoutText, Sprite } from '@/void'

export class Text {
  readonly #font: Font
  readonly #layer: number
  #str: string
  #rendered: boolean
  #w: number

  constructor(font: Font, layer: number, str: string, w: number) {
    this.#font = font
    this.#layer = layer
    this.#str = str
    this.#rendered = false
    this.#w = w
  }

  get layer(): number {
    return this.#layer
  }

  render<const FilmID extends AsepriteFileTag>(
    xy: Readonly<XY>,
    filmByID: FilmByID<FilmID>,
    layer: number,
  ): Sprite[] {
    // Always ensure sprites is nonzero length to meet typing requirements.
    const str = this.#str.length === 0 ? '\0' : this.#str
    const layout = layoutText(this.#font, str, this.#w)
    const sprites = []
    for (const [i, char] of layout.chars.entries()) {
      if (char == null) continue
      const filmID = fontCharToFilmID<FilmID>(this.#font, str[i]!)
      const sprite = new Sprite(filmByID[filmID], layer, char.xy.add(xy))
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
