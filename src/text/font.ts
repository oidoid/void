import type {Font} from 'mem-font'
import type {TagFormat} from '../graphics/atlas.ts'

export function fontCharToTag(font: Readonly<Font>, char: string): TagFormat {
  let pt = char.codePointAt(0)
  if (pt == null || pt > 0xff) pt = 63 // ?
  return `${font.id}--${pt.toString(16).padStart(2, '0')}`
}

/** @arg r undefined means end of line. */
export function fontKerning(
  font: Readonly<Font>,
  l: string,
  r: string | undefined
): number {
  if (r == null) return font.endOfLineKerning
  if (/^\s*$/.test(l) || /^\s*$/.test(r)) return font.whitespaceKerning
  return font.kerning[l + r] ?? font.defaultKerning
}

export function fontCharWidth(font: Readonly<Font>, letter: string): number {
  return font.charWidth[letter] ?? font.defaultCharWidth
}
