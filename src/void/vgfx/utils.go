package vgfx

import (
	"github.com/oidoid/void/src/void/vgeo"
	"github.com/oidoid/void/src/void/vmath"
)

// returns the next position on the pixel grid. xy includes fractional movement,
// snap is the previous grid position, and by gives the movement direction.
// diagonal movement advances both axes together by the smaller number of whole
// pixels reached on either axis. only for use with equal diagonal movements.
func SnapMove(xy, snap, by vgeo.XY[float32]) vgeo.XY[float32] {
	if by.X == 0 || by.Y == 0 {
		if by.X != 0 {
			snap.X = snapMoveAxis(xy.X, by.X)
		}
		if by.Y != 0 {
			snap.Y = snapMoveAxis(xy.Y, by.Y)
		}
		return snap
	}
	x := vmath.Abs(snapMoveAxis(xy.X, by.X) - snap.X)
	y := vmath.Abs(snapMoveAxis(xy.Y, by.Y) - snap.Y)
	if y < x {
		x = y
	}
	if by.X > 0 {
		snap.X += x
	} else {
		snap.X -= x
	}
	if by.Y > 0 {
		snap.Y += x
	} else {
		snap.Y -= x
	}
	return snap
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
	return vmath.Round(x)
}
