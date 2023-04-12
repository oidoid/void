import { AsepriteFileTag } from '@/atlas-pack'
import { FontMeta } from '@/mem'
import { isBlank } from '@/ooz'

export interface Font extends FontMeta {
  /** `cellHeight + leading`. */
  readonly lineHeight: number
}

export function fontCharToFilmID<const FilmID extends AsepriteFileTag>(
  self: Font,
  char: string,
): FilmID {
  let pt = char.codePointAt(0)
  if (pt == null || pt > 0xff) pt = 63 // ?
  return `${self.id}--${pt.toString(16)}` as FilmID
}

/** @arg rhs Undefined means end of line. */
export function fontKerning(
  self: Font,
  lhs: string,
  rhs: string | undefined,
): number {
  if (rhs == null) return self.endOfLineKerning
  if (isBlank(lhs) || isBlank(rhs)) return self.whitespaceKerning
  return self.kerning[lhs + rhs] ?? self.defaultKerning
}

export function fontCharWidth(self: Font, letter: string): number {
  return self.charWidth[letter] ?? self.defaultCharWidth
}
