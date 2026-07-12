package vgfx

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
	"github.com/oidoid/void/src/void/vtypes"
)

const Epsilon = float32(1) / 64

// snaps xy to half-pixel grid for diagonal movement by. call only at the start
// of movement, not each update.
func DiagonalizeXY[T vtypes.Number](xy vgeo.XY[float32], by vgeo.XY[T]) vgeo.XY[float32] {
	if by.X == 0 || by.Y == 0 {
		return xy
	}
	xy.X = float32(vmath.Floor(xy.X)) + 0.5
	if (by.X > 0) == (by.Y > 0) {
		xy.Y = float32(vmath.Floor(xy.Y)) + 0.5
	} else {
		xy.Y = float32(vmath.Floor(xy.Y)) + 0.5 - Epsilon
	}
	return xy
}

// floor to nearest sprite quantum (1/64).
func FloorEpsilon(x float32) float32 {
	return float32(vmath.Floor(x/Epsilon)) * Epsilon
}
