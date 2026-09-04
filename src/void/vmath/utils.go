package vmath

import (
	"math"

	"github.com/oidoid/void/src/void/vtypes"
)

func Abs[T vtypes.Num](v T) T {
	if v < 0 {
		return -v
	}
	return v
}

func Ceil[T vtypes.Num](v T) T {
	i := T(int64(v))
	if v > i {
		return i + 1
	}
	return i
}

func Clamp[T vtypes.Num](lo, hi, v T) T {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func Finite(v float32) bool {
	return !math.IsNaN(float64(v)) && !math.IsInf(float64(v), 0)
}

func Floor[T vtypes.Num](v T) T {
	i := T(int64(v))
	if v < i {
		return i - 1
	}
	return i
}

func Round[T vtypes.Num](v T) T {
	half := T(1) / 2
	if v < 0 {
		return Ceil(v - half)
	}
	return Floor(v + half)
}
