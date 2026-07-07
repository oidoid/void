package vmath

import "github.com/oidoid/void/src/void/vtypes"

func Clamp[T vtypes.Number](lo, hi, v T) T {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func Floor[T vtypes.Number](v T) T {
	i := T(int64(v))
	if v < i {
		return i - 1
	}
	return i
}
