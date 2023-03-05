import { Aseprite } from '@/atlas-pack'
import { FontMeta } from '@/mem'
import { I16, Str } from '@/ooz'

export interface Font<T extends number = I16> extends FontMeta<T> {
  /** `cellHeight + leading`. */
  readonly lineHeight: T
}

export namespace Font {
  export function charToFilmID<FilmID extends Aseprite.FileTag>(
    self: Font,
    char: string,
  ): FilmID {
    let pt = char.codePointAt(0)
    if (pt == null || pt > 0xff) pt = 63 // ?
    return `${self.id}--${pt.toString(16)}` as FilmID
  }

  /** @arg rhs Undefined means end of line. */
  export function kerning(
    self: Font,
    lhs: string,
    rhs: string | undefined,
  ): I16 {
    if (rhs == null) return self.endOfLineKerning
    if (Str.isBlank(lhs) || Str.isBlank(rhs)) return self.whitespaceKerning
    return self.kerning[lhs + rhs] ?? self.defaultKerning
  }

  export function charWidth(self: Font, letter: string): I16 {
    return self.charWidth[letter] ?? self.defaultCharWidth
  }
}
