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

func Ceil[T ~float32 | ~float64](v T) T {
	return T(math.Ceil(float64(v)))
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

func Floor[T ~float32 | ~float64](v T) T {
	return T(math.Floor(float64(v)))
}

// rounds to the nearest integer, with ties toward positive infinity.
func Round[T ~float32 | ~float64](v T) T {
	half := T(1) / 2
	return Floor(v + half)
}
