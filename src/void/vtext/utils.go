package vtext

import (
	"strconv"

	"github.com/oidoid/void/src/void/vtypes"
)

// format a float to a string with one decimal place.
func FmtFloat[T vtypes.Number](num T) string {
	i := int(num)
	frac := int((num - T(i)) * 10)
	if frac < 0 {
		frac = -frac
	}
	if num < 0 && i == 0 {
		return "-0." + strconv.Itoa(frac)
	}
	return strconv.Itoa(i) + "." + strconv.Itoa(frac)
}

// `FmtFloat()` but pad the integer part to at least two digits.
func FmtFloat2[T vtypes.Number](num T) string {
	s := FmtFloat(num)
	if len(s) < 4 { // e.g. "1.6" → " 1.6"
		return " " + s
	}
	return s
}

// pads a non-negative integer to at least width digits with spaces.
func PadInt(n, width int) string {
	s := strconv.Itoa(n)
	for len(s) < width {
		s = " " + s
	}
	return s
}

// whether char is zero or a whitespace character.
func isBlankCh(ch rune) bool {
	return ch == 0 || ch == ' ' || ch == '\t' || ch == '\n' ||
		ch == '\r' || ch == '\v' || ch == '\f'
}
