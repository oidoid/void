package vtext

import "unicode"

// whether char iz zero or a whitespace character.
func isBlankCh(ch rune) bool {
	return ch == 0 || unicode.IsSpace(ch)
}
