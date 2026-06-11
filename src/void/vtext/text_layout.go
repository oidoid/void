package vtext

import "github.com/oidoid/void/src/void/vmath"

type TextLayout struct {
	vmath.WH[int16]
	// the length of this slice matches the string length. zero boxes are
	// whitespace.
	Chars []vmath.Box[int16]
	// the offset in pixels.
	Cursor vmath.XY[int16]
	// the actual height without trailing leading and without descenders if
	// unused.
	TrimmedH int16
}

type TextLayoutOpts struct {
	Font  *Font
	MaxW  int16
	Scale uint8
	Text  string
}

func LayoutText(opts TextLayoutOpts) TextLayout {
	runes := []rune(opts.Text)
	chars := make([]vmath.Box[int16], len(runes))
	scale := opts.Scale
	if scale == 0 {
		scale = 1
	}
	maxW := opts.MaxW
	if maxW == 0 {
		maxW = 1<<15 - 1
	}
	cursor := vmath.XY[int16]{}
	var w int16
	var trimmedH uint8
	for i := 0; i < len(runes); {
		ch := runes[i]
		var layout TextLayout
		switch {
		case ch == '\n':
			layout = layoutNewline(opts.Font, cursor, 0, scale, w)
		case isBlankCh(ch):
			var next rune
			if i+1 < len(runes) {
				next = runes[i+1]
			}
			layout = layoutSpace(
				opts.Font,
				cursor,
				maxW,
				tracking(opts.Font, ch, next, scale),
				0,
				scale,
				trimmedH,
				ch,
				w,
			)
		default:
			layout = layoutWord(
				opts.Font,
				cursor,
				maxW,
				runes,
				i,
				0,
				scale,
				trimmedH,
				w,
			)
			nl := layoutNextLine(opts.Font, 0, cursor.Y, scale)
			if cursor.X > 0 &&
				layout.Cursor.Y == nl.Y &&
				layout.Cursor.X <= cursor.X {
				// word can fit on one line if cursor is reset to the start of line.
				cursor = layoutNextLine(opts.Font, 0, cursor.Y, scale)
				layout = layoutWord(
					opts.Font,
					cursor,
					maxW,
					runes,
					i,
					0,
					scale,
					trimmedH,
					w,
				)
			}
		}
		copy(chars[i:], layout.Chars)
		cursor = layout.Cursor
		w = layout.W
		trimmedH = uint8(layout.TrimmedH)
		i += len(layout.Chars)
	}
	return TextLayout{
		Chars:    chars,
		Cursor:   cursor,
		WH:       vmath.WH[int16]{W: w, H: layoutNextLine(opts.Font, 0, cursor.Y, scale).Y},
		TrimmedH: cursor.Y + int16(trimmedH),
	}
}

// lays out a run of non-whitespace characters starting at index.
func layoutWord(
	font *Font,
	cursor vmath.XY[int16],
	maxW int16,
	runes []rune,
	index int,
	startX int16,
	scale uint8,
	trimmedH uint8,
	w int16,
) TextLayout {
	chars := make([]vmath.Box[int16], len(runes)-index)
	n := 0
	x, y, fw := cursor.X, cursor.Y, w
	for ; index < len(runes); index++ {
		ch := runes[index]
		if isBlankCh(ch) {
			break
		}
		chH := font.CharH(ch) * scale
		var nextCh rune
		if index+1 < len(runes) {
			nextCh = runes[index+1]
		}
		span := tracking(font, ch, nextCh, scale)
		next := x > startX && x-startX+span > maxW
		if next {
			nl := layoutNextLine(font, startX, y, scale)
			x, y = nl.X, nl.Y
		}
		if next {
			trimmedH = chH
		} else {
			trimmedH = max(trimmedH, chH)
		}
		// width is not span since, with kerning, that may exceed the actual
		// width of the character's sprite. eg, if w has the maximal character width
		// of five pixels and a one pixel kerning for a given pair of characters, it
		// will have a span of six pixels which is greater than the maximal five
		// pixel sprite that can be rendered.
		chars[n] = vmath.XYWH(x, y, int16(font.CharW(ch)), int16(font.CellH))
		n++
		x += span
		fw = max(fw, x-startX)
	}
	return TextLayout{
		Chars:    chars[:n],
		Cursor:   vmath.XY[int16]{X: x, Y: y},
		TrimmedH: int16(trimmedH),
		WH:       vmath.WH[int16]{W: fw},
	}
}

func layoutNextLine(
	font *Font,
	startX int16,
	curY int16,
	scale uint8,
) vmath.XY[int16] {
	return vmath.NewXY(startX, curY+int16(font.LineH)*int16(scale))
}

func layoutNewline(
	font *Font,
	cursor vmath.XY[int16],
	startX int16,
	scale uint8,
	w int16,
) TextLayout {
	nextCursor := layoutNextLine(font, startX, cursor.Y, scale)
	if d := cursor.X - startX; d > 0 {
		w = max(w, d)
	}
	return TextLayout{
		Chars:  []vmath.Box[int16]{{}},
		Cursor: nextCursor,
		WH:     vmath.WH[int16]{W: w},
	}
}

// lays out a single whitespace character.
// span is the distance in pixels from the start of the current character to
// the start of the next including scale.
func layoutSpace(
	font *Font,
	cursor vmath.XY[int16],
	maxW int16,
	span int16,
	startX int16,
	scale uint8,
	trimmedH uint8,
	ch rune,
	w int16,
) TextLayout {
	var nextCursor vmath.XY[int16]
	if cursor.X > startX && cursor.X+span >= maxW {
		nextCursor = layoutNextLine(font, startX, cursor.Y, scale)
	} else {
		nextCursor = vmath.NewXY(cursor.X+span, cursor.Y)
	}
	chH := font.CharH(ch) * scale
	var newTrimmedH uint8
	if cursor.Y == nextCursor.Y {
		newTrimmedH = max(trimmedH, chH)
	} else {
		newTrimmedH = chH
	}
	if d := cursor.X - startX; d > 0 {
		w = max(w, d)
	}
	return TextLayout{
		Chars:    []vmath.Box[int16]{{}},
		Cursor:   nextCursor,
		TrimmedH: int16(newTrimmedH),
		WH:       vmath.WH[int16]{W: w},
	}
}

// the distance in pixels from the start of l to the start of r including scale.
func tracking(font *Font, l, r rune, scale uint8) int16 {
	return int16(scale) * (int16(font.CharW(l)) + int16(font.Kerning(l, r)))
}
