import { Font } from '@/mem'
import { AnimTag } from '../atlas/aseprite.ts'

export function fontCharToTag(self: Font, char: string): AnimTag {
  let pt = char.codePointAt(0)
  if (pt == null || pt > 0xff) pt = 63 // ?
  return `${self.id}--${pt.toString(16).padStart(2, '0')}`
}

/** @arg rhs Undefined means end of line. */
export function fontKerning(
  self: Font,
  lhs: string,
  rhs: string | undefined,
): number {
  if (rhs == null) return self.endOfLineKerning
  if (/^\s*$/.test(lhs) || /^\s*$/.test(rhs)) return self.whitespaceKerning
  return self.kerning[lhs + rhs] ?? self.defaultKerning
}

export function fontCharWidth(self: Font, letter: string): number {
  return self.charWidth[letter] ?? self.defaultCharWidth
}
