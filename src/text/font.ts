import type {Font} from 'mem-font'
import type {AnimTag} from '../graphics/atlas.ts'

export function fontCharToTag(font: Readonly<Font>, ch: string): AnimTag {
  let pt = ch.codePointAt(0)
  if (pt == null || pt > 0xff) pt = 63 // ?
  return `${font.id}--${pt.toString(16).padStart(2, '0')}`
}

export function fontCharH(font: Readonly<Font>, ch: string): number {
  return font.cellH - (font.descends[ch] ? 0 : font.baseline)
}

/** @arg r undefined means end of line. */
export function fontKerning(
  font: Readonly<Font>,
  l: string,
  r: string | undefined
): number {
  if (l === '\n' || r == null || r === '\n') return font.endOfLineKerning
  if (font.kerning[l + r] != null) return font.kerning[l + r]!
  if (/^\s?$/.test(l) || /^\s?$/.test(r)) return font.defaultWhitespaceKerning
  return font.defaultKerning
}

export function fontCharW(font: Readonly<Font>, ch: string): number {
  return font.charW[ch] ?? font.defaultCharW
}
