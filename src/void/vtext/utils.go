package vtext

import "github.com/oidoid/void/src/void/vtypes"

// fat savings version of `strconv.Itoa()`.
func Itoa(n int) string {
	if n == 0 {
		return "0"
	}

	neg := n < 0
	var u uint
	if neg {
		u = uint(-(n + 1)) + 1
	} else {
		u = uint(n)
	}

	var buf [20]byte
	i := len(buf)
	for u > 0 {
		i--
		buf[i] = byte('0' + u%10)
		u /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}

// format a float to a string with one decimal place.
func FmtFloat[T vtypes.Number](num T) string {
	i := int(num)
	frac := int((num - T(i)) * 10)
	if frac < 0 {
		frac = -frac
	}
	if num < 0 && i == 0 {
		return "-0." + Itoa(frac)
	}
	return Itoa(i) + "." + Itoa(frac)
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
func PadInt(n, w int) string {
	str := Itoa(n)
	for len(str) < w {
		str = " " + str
	}
	return str
}

// whether char is zero or a whitespace character.
func isBlankCh(ch rune) bool {
	return ch == 0 || ch == ' ' || ch == '\t' || ch == '\n' ||
		ch == '\r' || ch == '\v' || ch == '\f'
}
