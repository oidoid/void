import type {Font} from 'mem-font'
import type {Box, WH, XY} from '../types/geo.ts'
import {fontCharWidth, fontKerning} from './font.ts'

export type TextLayout = {
  /** the length of this array matches the string length. */
  chars: (Box | undefined)[]
  /** the offset in pixels. */
  cursor: XY
  wh: WH
}

export type TextLayoutOpts = {
  font: Font
  maxW?: number
  scale?: number
  start?: XY
  str: string
}

export function layoutText(opts: Readonly<TextLayoutOpts>): TextLayout {
  const chars = []
  const scale = opts.scale ?? 1
  const start: Readonly<XY> = opts.start ?? {x: 0, y: 0}
  const maxW = opts.maxW ?? Infinity
  let cursor = {x: start.x, y: start.y}
  let w = 0
  while (chars.length < opts.str.length) {
    const i = chars.length
    const char = opts.str[i]!
    let layout
    if (char === '\n') layout = layoutNewline(opts.font, cursor, start.x, scale)
    else if (/^\s*$/.test(char)) {
      layout = layoutSpace(
        opts.font,
        cursor,
        maxW,
        tracking(opts.font, char, opts.str[i + 1], scale),
        start.x,
        scale
      )
    } else {
      layout = layoutWord(opts.font, cursor, maxW, opts.str, i, start.x, scale)
      if (
        cursor.x > 0 &&
        layout.cursor.y === nextLine(opts.font, start.x, cursor.y, scale).y
      ) {
        const wordW = maxW - cursor.x + layout.cursor.x
        if (wordW <= maxW) {
          // word can fit on one line if cursor is reset to the start of line.
          cursor = nextLine(opts.font, start.x, cursor.y, scale)
          layout = layoutWord(
            opts.font,
            cursor,
            maxW,
            opts.str,
            i,
            start.x,
            scale
          )
        }
      }
    }
    chars.push(...layout.chars)
    cursor.x = layout.cursor.x
    cursor.y = layout.cursor.y
    w = Math.max(w, layout.cursor.x - start.x)
  }
  return {
    chars,
    cursor,
    wh: {w, h: nextLine(opts.font, start.x, cursor.y, scale).y - start.y}
  }
}

/** @internal */
export function layoutWord(
  font: Readonly<Font>,
  cursor: Readonly<XY>,
  maxW: number,
  word: string,
  index: number,
  startX: number,
  scale: number
): Omit<TextLayout, 'wh'> {
  const chars = []
  let {x, y} = cursor
  for (; ; index++) {
    const char = word[index]
    if (!char || /^\s*$/.test(char)) break

    const span = tracking(font, char, word[index + 1], scale)
    if (x > startX && x + span > startX + maxW)
      ({x, y} = nextLine(font, startX, y, scale))

    // width is not span since, with kerning, that may exceed the actual
    // width of the character's sprite. eg, if w has the maximal character width
    // of five pixels and a one pixel kerning for a given pair of characters, it
    // will have a span of six pixels which is greater than the maximal five
    // pixel sprite that can be rendered.
    chars.push({x, y, w: fontCharWidth(font, char), h: font.cellH})
    x += span
  }
  return {chars, cursor: {x, y}}
}

function nextLine(
  font: Readonly<Font>,
  startX: number,
  curY: number,
  scale: number
): XY {
  return {x: startX, y: curY + font.lineH * scale}
}

function layoutNewline(
  font: Readonly<Font>,
  cursor: Readonly<XY>,
  startX: number,
  scale: number
): Omit<TextLayout, 'wh'> {
  return {chars: [undefined], cursor: nextLine(font, startX, cursor.y, scale)}
}

/**
 * @arg span  the distance in pixels from the start of the current character to
 *            the start of the next including scale.
 */
function layoutSpace(
  font: Readonly<Font>,
  cursor: Readonly<XY>,
  w: number,
  span: number,
  startX: number,
  scale: number
): Omit<TextLayout, 'wh'> {
  const nextCursor =
    cursor.x > 0 && cursor.x + span >= w
      ? nextLine(font, startX, cursor.y, scale)
      : {x: cursor.x + span, y: cursor.y}
  return {chars: [undefined], cursor: nextCursor}
}

/**
 * the distance in pixels from the start of lhs to the start of rhs including
 * scale.
 */
function tracking(
  font: Readonly<Font>,
  l: string,
  r: string | undefined,
  scale: number
): number {
  return scale * (fontCharWidth(font, l) + fontKerning(font, l, r))
}
