import type {Font} from 'mem-font'
import type {Box, XY} from '../types/geo.ts'
import {fontCharH, fontCharW, fontKerning} from './font.ts'

export type TextLayout = {
  /**
   * the length of this array matches the string length. undefines are
   * whitespace.
   */
  chars: (Box | undefined)[]
  /** the offset in pixels. */
  cursor: XY
  w: number
  h: number
  /** the height without without leading and only actually used height of characters. */
  trimmedH: number
}

export type TextLayoutOpts = {
  font: Font
  maxW?: number
  scale?: number
  start?: XY
  text: string
}

// to-do: refactor so inputs and outputs of each function is a TextLayout.
type IntermediateTextLayout = Omit<TextLayout, 'h' | 'trimmedH'> & {
  trimmedLineH: number
}

export function layoutText(opts: Readonly<TextLayoutOpts>): TextLayout {
  const chars = []
  const scale = opts.scale ?? 1
  const start: Readonly<XY> = opts.start ?? {x: 0, y: 0}
  const maxW = opts.maxW ?? Infinity
  let cursor = {x: start.x, y: start.y}
  let w = 0
  let trimmedLineH = 0
  while (chars.length < opts.text.length) {
    const i = chars.length
    const ch = opts.text[i]!
    let layout
    if (ch === '\n')
      layout = layoutNewline(opts.font, cursor, start.x, scale, w)
    else if (/^\s*$/.test(ch))
      layout = layoutSpace(
        opts.font,
        cursor,
        maxW,
        tracking(opts.font, ch, opts.text[i + 1], scale),
        start.x,
        scale,
        trimmedLineH,
        ch,
        w
      )
    else {
      layout = layoutWord(
        opts.font,
        cursor,
        maxW,
        opts.text,
        i,
        start.x,
        scale,
        trimmedLineH,
        w
      )
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
            opts.text,
            i,
            start.x,
            scale,
            trimmedLineH,
            w
          )
        }
      }
    }
    chars.push(...layout.chars)
    cursor.x = layout.cursor.x
    cursor.y = layout.cursor.y
    w = layout.w
    trimmedLineH = layout.trimmedLineH
  }
  return {
    chars,
    cursor,
    w,
    h: nextLine(opts.font, cursor.x, cursor.y, scale).y - start.y,
    trimmedH: cursor.y + trimmedLineH * scale - start.y
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
  scale: number,
  trimmedLineH: number,
  w: number
): IntermediateTextLayout {
  const chars = []
  let {x, y} = cursor
  for (; ; index++) {
    const ch = word[index]
    if (!ch || /^\s*$/.test(ch)) break
    const chH = fontCharH(font, ch)

    const span = tracking(font, ch, word[index + 1], scale)
    const next = x > startX && x + span > startX + maxW
    if (next) ({x, y} = nextLine(font, startX, y, scale))
    trimmedLineH = next ? chH : Math.max(trimmedLineH, chH)

    // width is not span since, with kerning, that may exceed the actual
    // width of the character's sprite. eg, if w has the maximal character width
    // of five pixels and a one pixel kerning for a given pair of characters, it
    // will have a span of six pixels which is greater than the maximal five
    // pixel sprite that can be rendered.
    chars.push({x, y, w: fontCharW(font, ch), h: font.cellH})
    x += span
    w = Math.max(w, x - startX)
  }
  return {chars, cursor: {x, y}, trimmedLineH, w}
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
  scale: number,
  w: number
): IntermediateTextLayout {
  const nextCursor = nextLine(font, startX, cursor.y, scale)
  return {
    chars: [undefined],
    cursor: nextCursor,
    trimmedLineH: 0,
    w: Math.max(w, cursor.x - startX)
  }
}

/**
 * @arg span  the distance in pixels from the start of the current character to
 *            the start of the next including scale.
 */
function layoutSpace(
  font: Readonly<Font>,
  cursor: Readonly<XY>,
  maxW: number,
  span: number,
  startX: number,
  scale: number,
  trimmmedLineH: number,
  ch: string,
  w: number
): IntermediateTextLayout {
  const nextCursor =
    cursor.x > startX && cursor.x + span >= maxW
      ? nextLine(font, startX, cursor.y, scale)
      : {x: cursor.x + span, y: cursor.y}
  const chH = fontCharH(font, ch)
  return {
    chars: [undefined],
    cursor: nextCursor,
    trimmedLineH:
      cursor.y === nextCursor.y ? Math.max(trimmmedLineH, chH) : chH,
    w: Math.max(w, cursor.x - startX)
  }
}

/**
 * the distance in pixels from the start of l to the start of r including scale.
 */
function tracking(
  font: Readonly<Font>,
  l: string,
  r: string | undefined,
  scale: number
): number {
  return scale * (fontCharW(font, l) + fontKerning(font, l, r))
}
