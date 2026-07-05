package vmath

import "github.com/oidoid/void/src/void/vtypes"

func Floor[T vtypes.Number](v T) T {
	i := T(int64(v))
	if v < i {
		return i - 1
	}
	return i
}
