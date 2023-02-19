import { I16, I16Box, I16XY, Str, Uint } from '@/ooz'
import { Font } from '@/void'

export interface TextLayout {
  /** The length of this array matches the string length. */
  readonly chars: (Readonly<I16Box> | undefined)[]
  /** The offset in pixels. todo: should this be passed in? */
  readonly cursor: Readonly<I16XY>
}

export namespace TextLayout {
  /** @arg width The allowed layout width in pixels. */
  export function layout(font: Font, str: string, width: I16): TextLayout {
    const chars = []
    let cursor = new I16XY(0, 0)
    for (let i = 0, char = str[i]; char != null; char = str[i]) {
      let layout
      if (char == '\n') layout = layoutNewline(font, cursor)
      else if (Str.isBlank(char)) {
        layout = layoutSpace(
          font,
          cursor,
          width,
          tracking(font, char, str[i + 1]),
        )
      } else {
        layout = layoutWord(font, cursor, width, str, Uint(i))
        if (cursor.x > 0 && layout.cursor.y == nextLine(font, cursor.y).y) {
          const word_width = width - cursor.x + layout.cursor.x
          if (word_width <= width) {
            // Word can fit on one line if cursor is reset to the start of the
            // line.
            cursor = nextLine(font, cursor.y)
            layout = layoutWord(font, cursor, width, str, Uint(i))
          }
        }
      }
      i += layout.chars.length
      chars.push(...layout.chars)
      cursor.x = layout.cursor.x
      cursor.y = layout.cursor.y
    }
    return { chars, cursor }
  }

  /**
   * @arg cursor The cursor offset in pixels.
   * @arg width The allowed layout width in pixels.
   */
  export function layoutWord(
    font: Font,
    cursor: Readonly<I16XY>,
    width: I16,
    word: string,
    index: Uint,
  ): TextLayout {
    const chars = []
    let { x, y } = cursor
    for (;;) {
      const char = word[index]
      if (char == null || Str.isBlank(char)) break

      const span = tracking(font, char, word[index + 1])
      if (x > 0 && (x + span) > width) ({ x, y } = nextLine(font, y))

      // Width is not span since, with kerning, that may exceed the actual
      // width of the character's sprite. For example, if w has the maximal
      // character width of five pixels and a one pixel kerning for a given pair
      // of characters, it will have a span of six pixels which is greater than
      // the maximal five pixel sprite that can be rendered.
      const w = Font.charWidth(font, char)
      const h = font.cellHeight
      chars.push(I16Box.round(x, y, w, h))
      x = I16.round(x + span)

      index = Uint(index + 1)
    }
    return { chars, cursor: new I16XY(x, y) }
  }
}

function nextLine(font: Font, y: I16): I16XY {
  return I16XY.round(0, y + font.lineHeight)
}

/** @arg cursor The cursor offset in pixels. */
function layoutNewline(font: Font, { y }: Readonly<I16XY>): TextLayout {
  return { chars: [undefined], cursor: nextLine(font, y) }
}

/**
 * @arg xy The cursor offset in pixels.
 * @arg width The allowed layout width in pixels.
 * @arg span  The distance in pixels from the start of the current character to
 *            the start of the next including scale.
 */
function layoutSpace(
  font: Font,
  xy: Readonly<I16XY>,
  width: I16,
  span: I16,
): TextLayout {
  const cursor = (xy.x > 0 && (xy.x + span) >= width)
    ? nextLine(font, xy.y)
    : I16XY.round(xy.x + span, xy.y)
  return { chars: [undefined], cursor }
}

/** Returns the distance in pixels from the start of lhs to the start of rhs. */
function tracking(font: Font, lhs: string, rhs: string | undefined): I16 {
  return I16.round(Font.charWidth(font, lhs) + Font.kerning(font, lhs, rhs))
}
