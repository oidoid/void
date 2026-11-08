package vtext

import (
	"unicode/utf8"

	"github.com/oidoid/void/src/void/vgeo"
)

type TextLayout struct {
	vgeo.WH[int16]
	// one box per rune in the text. zero boxes are whitespace.
	Chars []vgeo.Box[int16]
	// end of text offset in pixels.
	Cursor vgeo.XY[int16]
	// actual height without trailing leading and without descenders if unused.
	TrimH int16
	// height without trailing leading regardless of whether descenders are in
	// use.
	TrimLeadForceH int16
	// height without trailing leading and without descender space regardless of
	// whether descenders are in use.
	TrimAllForceH int16
}

type TextLayoutOpts struct {
	Font  *Font
	MaxW  int16
	Scale uint8
	Text  string
}

// one word's layout.
type wordLayout struct {
	cursor vgeo.XY[int16]
	w      int16 // widest line so far.
	trimH  uint8
	runes  int // chars written.
	bytes  int // text consumed.
}

// lays out text into one allocation of char boxes.
func LayoutText(opts TextLayoutOpts) TextLayout {
	font, text := opts.Font, opts.Text
	scale := max(opts.Scale, 1)
	maxW := opts.MaxW
	if maxW == 0 {
		maxW = 1<<15 - 1
	}
	chars := make([]vgeo.Box[int16], utf8.RuneCountInString(text))
	var cursor vgeo.XY[int16]
	var w int16
	var trimH uint8
	i := 0 // rune index.
	for pos := 0; pos < len(text); {
		ch, size := utf8.DecodeRuneInString(text[pos:])
		switch {
		case ch == '\n':
			w = max(w, cursor.X)
			cursor = layoutNextLine(font, cursor.Y, scale)
			trimH = 0
		case isBlankCh(ch):
			span := tracking(font, ch, peekCh(text[pos+size:]), scale)
			next := vgeo.NewXY(cursor.X+span, cursor.Y)
			if cursor.X > 0 && cursor.X+span >= maxW {
				next = layoutNextLine(font, cursor.Y, scale)
			}
			chH := font.CharH(ch) * scale
			if cursor.Y == next.Y {
				trimH = max(trimH, chH)
			} else {
				trimH = chH
			}
			w = max(w, cursor.X)
			cursor = next
		default:
			word := layoutWord(
				font, chars[i:], text[pos:], cursor, maxW, scale, trimH, w,
			)
			if cursor.X > 0 && word.cursor.X <= cursor.X &&
				word.cursor.Y == layoutNextLine(font, cursor.Y, scale).Y {
				// word can fit on one line if cursor is reset to the start of line.
				cursor = layoutNextLine(font, cursor.Y, scale)
				word = layoutWord(
					font, chars[i:], text[pos:], cursor, maxW, scale, trimH, w,
				)
			}
			cursor, w, trimH = word.cursor, word.w, word.trimH
			i += word.runes
			pos += word.bytes
			continue
		}
		i++ // whitespace boxes stay zero.
		pos += size
	}
	return TextLayout{
		Chars:  chars,
		Cursor: cursor,
		WH:     vgeo.NewWH(w, layoutNextLine(font, cursor.Y, scale).Y),
		TrimH:  cursor.Y + int16(trimH),
		TrimLeadForceH: cursor.Y +
			int16(font.CellH)*int16(scale),
		TrimAllForceH: cursor.Y +
			int16(font.CellH-font.Baseline)*int16(scale),
	}
}

// lays out the leading run of non-whitespace characters in text into chars.
func layoutWord(
	font *Font,
	chars []vgeo.Box[int16],
	text string,
	cursor vgeo.XY[int16],
	maxW int16,
	scale uint8,
	trimH uint8,
	w int16,
) wordLayout {
	this := wordLayout{w: w, trimH: trimH}
	x, y := cursor.X, cursor.Y
	for this.bytes < len(text) {
		ch, size := utf8.DecodeRuneInString(text[this.bytes:])
		if isBlankCh(ch) {
			break
		}
		this.bytes += size
		chH := font.CharH(ch) * scale
		span := tracking(font, ch, peekCh(text[this.bytes:]), scale)
		if x > 0 && x+span > maxW {
			x, y = 0, layoutNextLine(font, y, scale).Y
			this.trimH = chH
		} else {
			this.trimH = max(this.trimH, chH)
		}
		// width is not span since, with kerning, that may exceed the actual width
		// of the character's spr. eg, if w has the maximal character width of five
		// pixels and a one pixel kerning for a given pair of characters, it will
		// have a span of six pixels which is greater than the maximal five pixel
		// spr that can be rendered.
		chars[this.runes] = vgeo.XYWH(
			x, y, int16(font.CharW(ch)), int16(font.CellH),
		)
		this.runes++
		x += span
		this.w = max(this.w, x)
	}
	this.cursor = vgeo.NewXY(x, y)
	return this
}

func layoutNextLine(font *Font, curY int16, scale uint8) vgeo.XY[int16] {
	return vgeo.NewXY(0, curY+int16(font.LineH)*int16(scale))
}

// next rune or zero at the end of text.
func peekCh(text string) rune {
	if text == "" {
		return 0
	}
	ch, _ := utf8.DecodeRuneInString(text)
	return ch
}

// distance in pixels from the start of l to the start of r including scale.
func tracking(font *Font, l, r rune, scale uint8) int16 {
	return int16(scale) * (int16(font.CharW(l)) + int16(font.Kerning(l, r)))
}
