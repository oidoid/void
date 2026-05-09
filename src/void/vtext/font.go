package vtext

//go:generate go run github.com/oidoid/void/src/cmd/genfont mem-prop-5x6.json mem_prop_5x6_gen.go

// holds metrics and detail metadata for a bitmap font.
type Font struct {
	// PostScript font name less than 63 characters and does not contain
	// `(){}[]<>%/ `. matches the font filename stem. Eg, "mem-mono-3x3".
	ID string
	// the human readable font name. eg, "mem mono 3x3".
	Name string
	// the maximum width of any character in the font in pixels. usually present
	// in font name. eg, the max width of "mem prop 5x6" is five pixels.
	CellW uint8
	// the maximum height of any character in the font in pixels, including
	// descenders but not leading. usually present in font name. eg, the max
	// height of "mem prop 5x6" is six pixels. the line height is
	// `cellH + leading` or seven pixels.
	CellH uint8
	// distance between lines in pixels.
	Leading uint8
	// `cellH + leading`.
	LineH uint8
	// the font's baseline as measured in pixels from the bottom of the cell
	// (`cellH`). when nonzero, this is the space available for descenders.
	Baseline uint8
	// variable distance between characters in pixels. the key is two characters
	// and the value may be negative.
	KerningPairs map[[2]rune]int8
	// character-to-character kerning pair widths in pixels. when a pair is not
	// present, `endOfLineKerning` is used when the pair matches the regular
	// expression `.$`, `defaultWhitespaceKerning` is used when the pair matches
	// the regular expression `.\s?|\s?.`, otherwise `defaultKerning` is used.
	DefaultKerning int8
	// default kerning for when *either* the left or right character is a space or
	// tab.
	DefaultWhitespaceKerning int8
	// kerning for when the right character is a newline.
	EndOfLineKerning int8
	// character width in pixels. When a character is not present, `defaultCharW`
	// is used.
	CharWidths map[rune]uint8
	// character width in pixels. when a character is not present in `charW`,
	// `defaultCharW` is used.
	DefaultCharW uint8
	// whether a character descends below the baseline.
	Descends map[rune]bool
}

const hexChars = "0123456789abcdef"

func (this *Font) CharToTag(ch rune) string {
	if ch > 0xff {
		ch = '?' // 63
	}
	// "%s--%02x"
	return this.ID + "--" + string([]byte{hexChars[ch>>4], hexChars[ch&0xf]})
}

func (this *Font) CharH(ch rune) int {
	if this.Descends[ch] {
		return int(this.CellH)
	}
	return int(this.CellH) - int(this.Baseline)
}

// empty r means end of line.
func (this *Font) Kerning(l, r rune) int {
	if l == '\n' || r == 0 || r == '\n' {
		return int(this.EndOfLineKerning)
	}
	if kerning, ok := this.KerningPairs[[2]rune{l, r}]; ok {
		return int(kerning)
	}
	if isBlankCh(l) || isBlankCh(r) {
		return int(this.DefaultWhitespaceKerning)
	}
	return int(this.DefaultKerning)
}

func (this *Font) CharW(ch rune) int {
	if w, ok := this.CharWidths[ch]; ok {
		return int(w)
	}
	return int(this.DefaultCharW)
}
