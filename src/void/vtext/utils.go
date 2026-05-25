package vtext

// whether char is zero or a whitespace character.
func isBlankCh(ch rune) bool {
	return ch == 0 || ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r' || ch == '\v' || ch == '\f'
}
