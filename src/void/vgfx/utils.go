package vgfx

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
)

// snaps xy toward by, or to the nearest grid point when an axis is still. use
// to align a stationary coord or start directional movement.
func SnapXY(xy, by vgeo.XY[float32]) vgeo.XY[float32] {
	xy.X = snapAxis(xy.X, by.X)
	xy.Y = snapAxis(xy.Y, by.Y)
	return xy
}

func snapAxis(x, by float32) float32 {
	if by > 0 {
		return vmath.Ceil(x)
	}
	if by < 0 {
		return vmath.Floor(x)
	}
	return vmath.Floor(x + .5)
}

// snaps snapXY to the grid points reached by xy. xy accumulates unsnapped
// movement, snapXY is the last snapped position, and by gives the movement
// direction. synchronizes diagonal axes by their completed amount.
func SnapMove(xy, snapXY, by vgeo.XY[float32]) vgeo.XY[float32] {
	if by.X == 0 || by.Y == 0 {
		if by.X != 0 {
			snapXY.X = snapMoveAxis(xy.X, by.X)
		}
		if by.Y != 0 {
			snapXY.Y = snapMoveAxis(xy.Y, by.Y)
		}
		return snapXY
	}
	x := vmath.Abs(snapMoveAxis(xy.X, by.X) - snapXY.X)
	y := vmath.Abs(snapMoveAxis(xy.Y, by.Y) - snapXY.Y)
	if y < x {
		x = y
	}
	if by.X > 0 {
		snapXY.X += x
	} else {
		snapXY.X -= x
	}
	if by.Y > 0 {
		snapXY.Y += x
	} else {
		snapXY.Y -= x
	}
	return snapXY
}

// snaps x to the latest grid point fully reached while moving by. floors
// positive motion and ceils negative motion so partial movement never jumps
// ahead. eg, -.2 moving negative remains at 0 until it reaches -1. use for each
// update of an accumulated movement coordinate.
func snapMoveAxis(x, by float32) float32 {
	if by > 0 {
		return vmath.Floor(x)
	}
	if by < 0 {
		return vmath.Ceil(x)
	}
	return vmath.Floor(x + .5)
}
